import axios from 'axios';
import { Readable } from 'stream';
import { Response } from 'express';
import { ChatMessage, StreamOptions } from './index';

function formatMessages(messages: ChatMessage[]): any[] {
  return messages.map(m => {
    if (!m.attachments?.length) return { role: m.role, content: m.content };

    // Multimodal: build content array with text + images + documents
    const parts: any[] = [];
    for (const att of m.attachments) {
      if (att.type === 'image' && att.base64) {
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${att.mimeType};base64,${att.base64}` },
        });
      } else if (att.type === 'document' && att.base64 && att.mimeType === 'application/pdf') {
        parts.push({
          type: 'file',
          file: {
            filename: att.fileName || 'document.pdf',
            file_data: `data:application/pdf;base64,${att.base64}`,
          },
        });
      }
    }
    parts.push({ type: 'text', text: m.content });
    return { role: m.role, content: parts };
  });
}

// Format messages for the Responses API (uses 'input' instead of 'messages')
function formatInputForResponses(messages: ChatMessage[]): any[] {
  return messages.map(m => {
    if (!m.attachments?.length) return { role: m.role, content: m.content };

    const parts: any[] = [];
    for (const att of m.attachments) {
      if (att.type === 'image' && att.base64) {
        parts.push({
          type: 'input_image',
          image_url: `data:${att.mimeType};base64,${att.base64}`,
        });
      } else if (att.type === 'document' && att.base64 && att.mimeType === 'application/pdf') {
        parts.push({
          type: 'input_file',
          filename: att.fileName || 'document.pdf',
          file_data: `data:application/pdf;base64,${att.base64}`,
        });
      }
    }
    parts.push({ type: 'input_text', text: m.content });
    return { role: m.role, content: parts };
  });
}

/**
 * Stream via the Chat Completions API (standard path, no web search)
 */
async function streamViaChatCompletions(
  messages: ChatMessage[],
  model: string,
  res: Response,
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const isReasoningModel = model.startsWith('o3') || model.startsWith('o4') || model.startsWith('gpt-5');

  const data: any = {
    model,
    messages: formatMessages(messages),
    stream: true,
  };

  if (isReasoningModel) {
    if (options?.reasoningEffort) {
      data.reasoning_effort = options.reasoningEffort;
    }
  } else {
    data.temperature = 0.7;
  }

  const response = await axios({
    method: 'post',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data,
    responseType: 'stream',
  });

  let assistantText = '';
  const stream = response.data as unknown as Readable;

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => {
      const chunkStr = chunk.toString();
      chunkStr.split('\n').forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) assistantText += content;
          } catch {}
        }
      });
      res.write(chunk);
    });
    stream.on('end', () => resolve(assistantText));
    stream.on('error', reject);
  });
}

/**
 * Stream via the Responses API (used when web search is enabled).
 * Converts the Responses API SSE format into Chat Completions format
 * so the frontend parser doesn't need any changes.
 */
async function streamViaResponsesAPI(
  messages: ChatMessage[],
  model: string,
  res: Response,
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Handle search modes by appending filters to the last user message
  const inputMessages = formatInputForResponses(messages);
  const lastMsg = inputMessages[inputMessages.length - 1];

  if (lastMsg && lastMsg.role === 'user' && options?.searchMode && options.searchMode !== 'auto') {
    let querySuffix = '';
    let instruction = '';

    switch (options.searchMode) {
      case 'human':
        querySuffix = ' (site:reddit.com OR site:news.ycombinator.com OR site:stackexchange.com OR site:quora.com OR site:medium.com)';
        instruction = '\n\n[System: Prioritize search results from forums and human discussions.]';
        break;
      case 'pre_ai':
        querySuffix = ' before:2023-01-01';
        instruction = '\n\n[System: Prioritize information published before 2023.]';
        break;
      case 'custom':
        if (options.customSites && options.customSites.length > 0) {
          const sites = options.customSites.map(s => `site:${s.trim()}`).join(' OR ');
          querySuffix = ` (${sites})`;
          instruction = `\n\n[System: Only use information from these domains: ${options.customSites.join(', ')}]`;
        }
        break;
    }

    if (querySuffix) {
      // Input content in Responses API can be string or array of parts
      if (typeof lastMsg.content === 'string') {
        lastMsg.content += `${querySuffix}${instruction}`;
      } else if (Array.isArray(lastMsg.content)) {
        const textPart = lastMsg.content.find((p: any) => p.type === 'input_text');
        if (textPart) {
          textPart.text += `${querySuffix}${instruction}`;
        }
      }
    }
  }

  const data: any = {
    model,
    input: inputMessages,
    tools: [{ type: 'web_search_preview' }],
    stream: true,
  };

  if (options?.reasoningEffort) {
    data.reasoning = { effort: options.reasoningEffort };
  }

  console.log('[openai] Using Responses API with web_search_preview');

  const response = await axios({
    method: 'post',
    url: 'https://api.openai.com/v1/responses',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data,
    responseType: 'stream',
  });

  let assistantText = '';
  const stream = response.data as unknown as Readable;

  return new Promise((resolve, reject) => {
    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);

          // Extract text deltas from the Responses API format
          if (event.type === 'response.output_text.delta' && event.delta) {
            assistantText += event.delta;
            // Convert to Chat Completions SSE format for the frontend
            const ccFormat = JSON.stringify({
              choices: [{ delta: { content: event.delta } }],
            });
            res.write(`data: ${ccFormat}\n\n`);
          }
        } catch {}
      }
    });

    stream.on('end', () => {
      // Process remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === 'response.output_text.delta' && event.delta) {
              assistantText += event.delta;
              const ccFormat = JSON.stringify({
                choices: [{ delta: { content: event.delta } }],
              });
              res.write(`data: ${ccFormat}\n\n`);
            }
          } catch {}
        }
      }
      res.write('data: [DONE]\n\n');
      resolve(assistantText);
    });

    stream.on('error', reject);
  });
}

export async function streamOpenAI(
  messages: ChatMessage[],
  model: string,
  res: Response,
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  // Use Responses API when web search is enabled
  if (options?.deepSearch) {
    return streamViaResponsesAPI(messages, model, res, options);
  }

  // Otherwise use the standard Chat Completions API
  return streamViaChatCompletions(messages, model, res, options);
}
