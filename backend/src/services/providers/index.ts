import { Response } from 'express';
import { streamOpenAI } from './openai';
import { streamAnthropic } from './anthropic';
import { streamGoogle } from './google';

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document';
  mimeType: string;
  fileName: string;
  url: string;
  base64?: string;
  size?: number;
}

export interface ChatMessage {
  role: string;
  content: string;
  attachments?: ChatAttachment[];
}

export interface StreamOptions {
  reasoningEffort?: 'low' | 'medium' | 'high';
  deepSearch?: boolean;
}

export async function streamToProvider(
  provider: string,
  messages: ChatMessage[],
  model: string,
  res: Response,
  options?: StreamOptions
): Promise<string> {
  switch (provider) {
    case 'OpenAI':
      return streamOpenAI(messages, model, res, options);
    case 'Anthropic':
      return streamAnthropic(messages, model, res);
    case 'Google':
      return streamGoogle(messages, model, res);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
