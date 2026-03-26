function isMathLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith('```') || t.startsWith('#') || t.startsWith('-') || t.startsWith('*') || t.startsWith('>')) return false;
  if (t.includes('$')) return false;
  
  const hasLatexCommand = /\\(frac|sqrt|sum|prod|int|dot|ddot|theta|mathbf|mathrm|text|left|right|lbrace|rbrace|alpha|beta|gamma|pi|sigma|omega|partial|infty|delta|nabla|approx|equiv|leq|geq|neq|pm|times|div|cup|cap|in|subset|superset|forall|exists|ldots|cdots|vdots|ddots|prime|dagger|dagger|dag|ddag|checkmark|dag|ast|star|bullet|circ|sim|simeq|cong|approx|equiv|not|neg|exists|forall|perp|parallel|propto|mid|nmid|therefore|because)\b/.test(t);
  
  return hasLatexCommand || /[=_{}^]/.test(t);
}

function normalizeSegment(segment: string): string {
  let text = segment;

  text = text
    .replace(/^\\(#{1,6}\s)/gm, '$1')
    .replace(/^\\([>*\-]\s)/gm, '$1')
    .replace(/(\s)\\(#{1,6})(\s|$)/gm, '$1$2$3')
    .replace(/\\([a-z])\-/g, '-');

  const openInline = (text.match(/\\\(/g) || []).length;
  const closeInline = (text.match(/\\\)/g) || []).length;
  if (openInline === closeInline && openInline > 0) {
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (m, expr) => `$${expr.trim()}$`);
  } else {
    text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  }

  const openBlock = (text.match(/\\\[/g) || []).length;
  const closeBlock = (text.match(/\\\]/g) || []).length;
  if (openBlock === closeBlock && openBlock > 0) {
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (m, expr) => `$$\n${expr.trim()}\n$$`);
  } else {
    text = text.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  }

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('```') || /^(#{1,6}\s|[*\-]\s|>\s)/.test(trimmed)) {
      result.push(line);
      continue;
    }

    if (trimmed === '[') {
      let closeIdx = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === ']') {
          closeIdx = j;
          break;
        }
      }
      if (closeIdx > i) {
        const inner = lines.slice(i + 1, closeIdx).join('\n').trim();
        if (inner && isMathLine(inner)) {
          result.push('$$', inner, '$$');
          i = closeIdx;
          continue;
        }
      }
      result.push(line);
      continue;
    }

    if (isMathLine(trimmed)) {
      const indent = line.match(/^\s*/)?.[0] || '';
      result.push(indent + '$$', trimmed, indent + '$$');
    } else if (trimmed.includes('$') && !trimmed.startsWith('$$')) {
      const dollarCount = (trimmed.match(/(?<!\\)\$/g) || []).length;
      if (dollarCount % 2 !== 0) {
        result.push(line.replace(/(?<!\\)\$/g, '\\$'));
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n').replace(/\r\n/g, '\n');
}

export function normalizeAssistantMarkdown(markdown: string): string {
  return (markdown || '')
    .split(/(```[\s\S]*?```)/g)
    .map((segment) => (segment.startsWith('```') ? segment : normalizeSegment(segment)))
    .join('')
    .replace(/\r\n/g, '\n');
}

export type StreamNormalizationEvent =
  | { type: 'append'; content: string }
  | { type: 'replace'; content: string };

export class MarkdownStreamNormalizer {
  private raw = '';
  private emitted = '';

  ingest(chunk: string): StreamNormalizationEvent | null {
    if (!chunk) return null;
    this.raw += chunk;

    const normalized = normalizeAssistantMarkdown(this.raw);
    if (normalized.startsWith(this.emitted)) {
      const append = normalized.slice(this.emitted.length);
      this.emitted = normalized;
      if (!append) return null;
      return { type: 'append', content: append };
    }

    this.emitted = normalized;
    return { type: 'replace', content: normalized };
  }

  finalize(): StreamNormalizationEvent | null {
    const normalized = normalizeAssistantMarkdown(this.raw);
    if (normalized === this.emitted) return null;
    this.emitted = normalized;
    return { type: 'replace', content: normalized };
  }

  getText(): string {
    return this.emitted;
  }
}
