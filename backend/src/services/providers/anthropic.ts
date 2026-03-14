import { Response } from 'express';
import { ChatMessage } from './index';

function formatMessages(messages: ChatMessage[]): any[] {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => {
      if (!m.attachments?.length) return { role: m.role, content: m.content };

      // Multimodal: build content array with images, documents + text
      const content: any[] = [];
      for (const att of m.attachments) {
        if (att.type === 'image' && att.base64) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: att.mimeType, data: att.base64 },
          });
        } else if (att.type === 'document' && att.base64 && att.mimeType === 'application/pdf') {
          // Claude can read PDFs natively via document content type
          content.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: att.base64 },
          });
        }
      }
      content.push({ type: 'text', text: m.content });
      return { role: m.role, content };
    });
}

export async function streamAnthropic(
  messages: ChatMessage[],
  model: string,
  res: Response
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key not configured');

  // Extract system messages and combine them
  const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
  const systemPrompt = systemParts.length > 0 ? systemParts.join('\n\n') : undefined;

  const body: any = {
    model,
    max_tokens: 8192,
    messages: formatMessages(messages),
    stream: true,
  };
  if (systemPrompt) body.system = systemPrompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${err}`);
  }

  let assistantText = '';
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
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            const text = parsed.delta.text;
            assistantText += text;
            // Transform to OpenAI SSE format for frontend compatibility
            const openAIFormat = JSON.stringify({
              choices: [{ delta: { content: text } }],
            });
            res.write(`data: ${openAIFormat}\n\n`);
          }
        } catch {}
      }
    }
  }

  res.write('data: [DONE]\n\n');
  return assistantText;
}
