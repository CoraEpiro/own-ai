function escapeUnmatchedInlineDollars(line: string): string {
  const withoutDouble = line.replace(/\$\$/g, '');
  const singleDollarMatches = withoutDouble.match(/(?<!\\)\$/g) || [];
  if (singleDollarMatches.length % 2 === 0) return line;
  return line.replace(/(?<!\\)\$/g, '\\$');
}

function looksLikeFormulaLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.includes('$')) return false;
  if (/^(```|#{1,6}\s|[*-]\s|>\s)/.test(t)) return false;

  const hasLatexCommand = /\\[a-zA-Z]+/.test(t);
  const hasMathSymbols = /[=^_{}]/.test(t);
  const hasGreekWord = /\b(alpha|beta|gamma|theta|lambda|pi|sigma|omega)\b/i.test(t);
  if (!(hasLatexCommand || hasMathSymbols || hasGreekWord)) return false;

  const words = t.split(/\s+/);
  const proseLike = words.length >= 9 && /[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(t);
  return !proseLike;
}

function normalizeSegment(segment: string): string {
  const normalizedEscapes = segment
    .replace(/^\\(#{1,6}\s)/gm, '$1')
    .replace(/^\\([>*-]\s)/gm, '$1');

  let withDelimiters = normalizedEscapes;

  const openInline = (withDelimiters.match(/\\\(/g) || []).length;
  const closeInline = (withDelimiters.match(/\\\)/g) || []).length;
  if (openInline === closeInline) {
    withDelimiters = withDelimiters.replace(/\\\(([\s\S]*?)\\\)/g, (_m, expr) => `$${String(expr).trim()}$`);
  } else {
    withDelimiters = withDelimiters.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  }

  const openBlock = (withDelimiters.match(/\\\[/g) || []).length;
  const closeBlock = (withDelimiters.match(/\\\]/g) || []).length;
  if (openBlock === closeBlock) {
    withDelimiters = withDelimiters.replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => `$$\n${String(expr).trim()}\n$$`);
  } else {
    withDelimiters = withDelimiters.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  }

  const lines = withDelimiters.split('\n');
  const repairedBracketBlocks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    if (current !== '[') {
      repairedBracketBlocks.push(lines[i]);
      continue;
    }

    let closeIndex = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === ']') {
        closeIndex = j;
        break;
      }
    }
    if (closeIndex === -1) {
      repairedBracketBlocks.push(lines[i]);
      continue;
    }

    const innerLines = lines.slice(i + 1, closeIndex);
    const inner = innerLines.join('\n').trim();
    const mathLike = /\\[a-zA-Z]+|[=^_{}]|\\dot|\\ddot|\b(alpha|beta|gamma|theta|lambda|pi|sigma|omega)\b/i.test(inner);

    if (!inner || !mathLike) {
      repairedBracketBlocks.push(lines[i], ...innerLines, lines[closeIndex]);
      i = closeIndex;
      continue;
    }

    repairedBracketBlocks.push('$$', inner, '$$');
    i = closeIndex;
  }

  withDelimiters = repairedBracketBlocks.join('\n');

  const withWrappedFormulaLines = withDelimiters
    .split('\n')
    .flatMap((line) => (looksLikeFormulaLine(line) ? ['$$', line.trim(), '$$'] : [line]))
    .join('\n');

  return withWrappedFormulaLines
    .split('\n')
    .map(escapeUnmatchedInlineDollars)
    .join('\n');
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
