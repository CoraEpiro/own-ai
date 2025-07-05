export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  isAvailable: boolean;
  description?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
  cost?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
} 