import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Types ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  model: string;
  summary: string | null;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  message: string;
  model?: string;
  tokens_used?: number;
  cost?: number;
  timestamp: string;
  attachments?: any[];
}

// ── User Operations ────────────────────────────────────

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data;
};

export const createUser = async (userData: { email: string; password: string }): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email: userData.email, password: userData.password }])
    .select()
    .single();
  if (error) throw new Error('Failed to create user');
  return data;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
};

// ── Conversation Operations ────────────────────────────

export const createConversation = async (
  userId: string,
  title: string,
  model: string
): Promise<ConversationRow> => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, title, model }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
};

export const getConversations = async (userId: string) => {
  // Get conversations with aggregated message stats
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !conversations) return [];

  // Get message counts and totals for each conversation
  const results = await Promise.all(
    conversations.map(async (conv) => {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('tokens_used, cost')
        .eq('conversation_id', conv.id);

      const messageCount = messages?.length || 0;
      const totalTokens = messages?.reduce((s, m) => s + (m.tokens_used || 0), 0) || 0;
      const totalCost = messages?.reduce((s, m) => s + (m.cost || 0), 0) || 0;

      return { ...conv, messageCount, totalTokens, totalCost };
    })
  );

  return results;
};

export const getConversationById = async (
  conversationId: string,
  userId: string
): Promise<ConversationRow | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
};

export const getConversationMessages = async (
  conversationId: string
): Promise<ChatMessageRow[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });
  if (error) return [];
  return data || [];
};

export const saveConversationMessage = async (
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  model?: string,
  tokensUsed?: number,
  cost?: number,
  attachments?: any[]
): Promise<ChatMessageRow> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      conversation_id: conversationId,
      role,
      message: content,
      model,
      tokens_used: tokensUsed,
      cost,
      ...(attachments?.length ? { attachments } : {}),
    }])
    .select()
    .single();
  if (error) throw new Error(`Failed to save message: ${error.message}`);

  // Touch conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

export const deleteConversation = async (conversationId: string, userId: string) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete conversation: ${error.message}`);
};

export const updateConversationTitle = async (conversationId: string, title: string) => {
  await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);
};

export const updateConversationSummary = async (conversationId: string, summary: string) => {
  await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId);
};

export const updateConversationSystemPrompt = async (conversationId: string, systemPrompt: string) => {
  await supabase
    .from('conversations')
    .update({ system_prompt: systemPrompt })
    .eq('id', conversationId);
};

// ── Usage Tracking ─────────────────────────────────────

export const getUserUsage = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('tokens_used, cost')
    .eq('user_id', userId);

  if (error) return { totalTokens: 0, totalCost: 0, messageCount: 0 };

  return {
    totalTokens: data?.reduce((s, m) => s + (m.tokens_used || 0), 0) || 0,
    totalCost: data?.reduce((s, m) => s + (m.cost || 0), 0) || 0,
    messageCount: data?.length || 0,
  };
};
