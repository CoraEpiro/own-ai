import { Response } from 'express';
import { ChatMessage, StreamOptions } from './index';
import { performWebSearch } from '../webSearchService';

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
  res: Response,
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key not configured');

  // Extract system messages and combine them
  const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
  // Add today's date to system prompt to help with "current" queries
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dateContext = `Current date: ${today}`;
  let systemPrompt = systemParts.length > 0 ? `${systemParts.join('\n\n')}\n\n${dateContext}` : dateContext;

  // Perform web search if requested
  if (options?.deepSearch) {
    // Get the last user message
    const userMsg = messages.filter(m => m.role === 'user').pop();
    const userQuery = userMsg?.content || '';
    
    if (userQuery) {
      // Use "sophisticatedly cheap" cross-provider search (Gemini Flash)
      // Pass the search options from the frontend request
      const searchMode = options.searchMode || 'auto';
      const customSites = options.customSites;
      
      console.log(`[anthropic] Performing web search for query: "${userQuery.substring(0, 50)}..." Mode: ${searchMode}`);
      
      // Perform the search using our service
      const searchContext = await performWebSearch(userQuery, { 
        mode: searchMode, 
        customSites: customSites 
      });
      
      if (searchContext) {
        // Inject search results into the system prompt
        // This gives Claude the context it needs to answer current questions
        systemPrompt += `\n\n${searchContext}\n\nInstructions: Use the [Web Search Results] above to answer the user's question with current information. Cite sources if mentioned.`;
      } else {
        console.warn('[anthropic] Web search returned no results.');
      }
    }
  }

  const messagesForAnthropic = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      // Basic text message
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

  const body: any = {
    model,
    max_tokens: 8192,
    messages: messagesForAnthropic,
    stream: true,
  };
  
  if (systemPrompt) body.system = systemPrompt;

  // Add computer use / search tools if supported by model
  // Note: Currently Anthropic API doesn't have native web search tool like OpenAI/Google
  // We rely on the system prompt date context + model's own knowledge for now
  // until we implement a custom tool execution loop (which requires a major architecture change)

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
