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
  capabilities?: string[];
  category?: string;
  contextWindow?: number;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  mimeType: string;
  fileName: string;
  url: string;
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
  cost?: number;
  attachments?: Attachment[];
  reasoningContent?: string;
  replyTo?: {
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  buckets?: Bucket[];
}

export interface Folder {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Bucket {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BucketEntry {
  id: string;
  bucket_id: string;
  title: string;
  content: string;
  entry_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
} 
