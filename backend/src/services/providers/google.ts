import { Response } from 'express';
import { ChatMessage } from './index';

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
  res: Response
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
            assistantText += text;
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
