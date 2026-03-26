import { Response } from 'express';
import { ChatMessage } from './index';
import { MarkdownStreamNormalizer } from '../../utils/markdown';

function formatContents(messages: ChatMessage[]): any[] {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const parts: any[] = [];

      // Add image and document attachments first
      if (m.attachments?.length) {
        for (const att of m.attachments) {
          if (att.type === 'image' && att.base64) {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
          } else if (att.type === 'document' && att.base64 && att.mimeType === 'application/pdf') {
            // Gemini can read PDFs natively via inlineData
            parts.push({ inlineData: { mimeType: 'application/pdf', data: att.base64 } });
          }
        }
      }

      parts.push({ text: m.content });
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
}

export async function streamGoogle(
  messages: ChatMessage[],
  model: string,
  res: Response,
  options?: any
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  // Extract and combine system messages
  const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
  const systemInstruction = systemParts.length > 0 ? systemParts.join('\n\n') : undefined;

  const body: any = {
    contents: formatContents(messages),
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };

  if (options?.deepSearch) {
    // Gemini 2.5 and newer models use "google_search" tool
    // Older models use "googleSearchRetrieval"
    if (model.includes('gemini-2.5')) {
      body.tools = [{ google_search: {} }];
    } else {
      body.tools = [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.3
            }
          }
        }
      ];
    }

    // Handle search modes
    const contents = body.contents;
    const lastMsg = contents[contents.length - 1];
    
    if (lastMsg && lastMsg.role === 'user' && lastMsg.parts && lastMsg.parts.length > 0) {
      let querySuffix = '';
      let instruction = '';

      switch (options.searchMode) {
        case 'human':
          querySuffix = ' (site:reddit.com OR site:news.ycombinator.com OR site:stackexchange.com OR site:quora.com OR site:medium.com)';
          instruction = ' [System: Prioritize forum discussions and human-authored content.]';
          break;
        case 'pre_ai':
          querySuffix = ' before:2023-01-01';
          instruction = ' [System: Prioritize information published before 2023.]';
          break;
        case 'custom':
          if (options.customSites && options.customSites.length > 0) {
            const sites = options.customSites.map((s: string) => `site:${s.trim()}`).join(' OR ');
            querySuffix = ` (${sites})`;
            instruction = ` [System: Only use information from these domains: ${options.customSites.join(', ')}]`;
          }
          break;
      }

      if (querySuffix) {
        // Append to the last text part
        const textPart = lastMsg.parts.find((p: any) => p.text);
        if (textPart) {
          textPart.text += `${querySuffix}${instruction}`;
        }
      }
    }
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  let assistantText = '';
  const normalizer = new MarkdownStreamNormalizer();
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const event = normalizer.ingest(text);
            if (!event) continue;
            if (event.type === 'append') {
              assistantText += event.content;
              const openAIFormat = JSON.stringify({
                choices: [{ delta: { content: event.content } }],
              });
              res.write(`data: ${openAIFormat}\n\n`);
            } else {
              assistantText = event.content;
              const replaceEvent = JSON.stringify({ type: 'replace_content', content: event.content });
              res.write(`data: ${replaceEvent}\n\n`);
            }
          }
        } catch {}
      }
    }
  }

  const finalEvent = normalizer.finalize();
  if (finalEvent) {
    if (finalEvent.type === 'replace') {
      assistantText = finalEvent.content;
      const replaceEvent = JSON.stringify({ type: 'replace_content', content: finalEvent.content });
      res.write(`data: ${replaceEvent}\n\n`);
    } else {
      assistantText += finalEvent.content;
      const openAIFormat = JSON.stringify({
        choices: [{ delta: { content: finalEvent.content } }],
      });
      res.write(`data: ${openAIFormat}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  return assistantText;
}
