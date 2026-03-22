import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function sanitizeStringForDb(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);

    // Strip NULL and disallowed control chars that commonly break JSONB parsing
    if (code === 0) continue;
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;

    // Keep valid surrogate pairs, drop unpaired surrogates
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += input[i] + input[i + 1];
        i++;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;

    out += input[i];
  }
  return out;
}

function sanitizeJsonValueForDb(value: any): any {
  if (typeof value === 'string') return sanitizeStringForDb(value);
  if (Array.isArray(value)) return value.map(v => sanitizeJsonValueForDb(v));
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeJsonValueForDb(v);
    }
    return result;
  }
  return value;
}

// ── Types ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password: string;
  bio?: string;
  created_at: Date;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  model: string;
  summary: string | null;
  system_prompt: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BucketRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BucketEntryRow {
  id: string;
  bucket_id: string;
  title: string;
  content: string;
  entry_type: string;
  sort_order: number;
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

export const getUserBio = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('users')
    .select('bio')
    .eq('id', userId)
    .single();
  if (error || !data) return '';
  return data.bio || '';
};

export const updateUserBio = async (userId: string, bio: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ bio })
    .eq('id', userId);
  if (error) throw new Error('Failed to update bio');
};

// ── Memory Operations ─────────────────────────────────

const MAX_MEMORIES_PER_USER = 100;

export interface MemoryRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const getUserMemories = async (userId: string): Promise<MemoryRow[]> => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const addMemory = async (userId: string, content: string): Promise<MemoryRow | null> => {
  // Enforce cap
  const { count } = await supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((count ?? 0) >= MAX_MEMORIES_PER_USER) return null;

  const trimmed = content.trim().substring(0, 200);
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from('memories')
    .insert({ user_id: userId, content: trimmed })
    .select()
    .single();
  if (error) return null;
  return data;
};

export const deleteMemory = async (memoryId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId);
  return !error;
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
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !conversations?.length) return [];

  // Batch-fetch all message stats in ONE query instead of N queries
  const convIds = conversations.map(c => c.id);
  const { data: allMessages } = await supabase
    .from('chat_messages')
    .select('conversation_id, tokens_used, cost')
    .in('conversation_id', convIds);

  // Aggregate in-memory (O(n) single pass)
  const statsMap: Record<string, { messageCount: number; totalTokens: number; totalCost: number }> = {};
  for (const msg of allMessages || []) {
    const s = statsMap[msg.conversation_id] ??= { messageCount: 0, totalTokens: 0, totalCost: 0 };
    s.messageCount++;
    s.totalTokens += msg.tokens_used || 0;
    s.totalCost += msg.cost || 0;
  }

  return conversations.map(conv => ({
    ...conv,
    ...(statsMap[conv.id] || { messageCount: 0, totalTokens: 0, totalCost: 0 }),
  }));
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
  const safeContent = sanitizeStringForDb(content || '');
  const safeAttachments = attachments?.length
    ? (sanitizeJsonValueForDb(attachments) as any[])
    : undefined;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      conversation_id: conversationId,
      role,
      message: safeContent,
      model,
      tokens_used: tokensUsed,
      cost,
      ...(safeAttachments?.length ? { attachments: safeAttachments } : {}),
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

export const getTodayCost = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('cost')
    .eq('user_id', userId)
    .gte('timestamp', todayIso);

  if (error) return 0;

  return data?.reduce((s, m) => s + (m.cost || 0), 0) || 0;
};

export const getConversationCost = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('cost')
    .eq('conversation_id', conversationId);

  if (error) return 0;

  return data?.reduce((s, m) => s + (m.cost || 0), 0) || 0;
};

// ── Folder Operations ─────────────────────────────────

export const createFolder = async (userId: string, name: string): Promise<FolderRow> => {
  const { data, error } = await supabase
    .from('folders')
    .insert([{ user_id: userId, name }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create folder: ${error.message}`);
  return data;
};

export const getFolders = async (userId: string): Promise<FolderRow[]> => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
};

export const updateFolder = async (folderId: string, userId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to update folder: ${error.message}`);
};

export const deleteFolder = async (folderId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete folder: ${error.message}`);
};

export const moveConversationToFolder = async (
  conversationId: string,
  userId: string,
  folderId: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({ folder_id: folderId })
    .eq('id', conversationId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to move conversation: ${error.message}`);
};

// ── Bucket Operations ─────────────────────────────────

export const createBucket = async (userId: string, name: string, description?: string): Promise<BucketRow> => {
  const { data, error } = await supabase
    .from('buckets')
    .insert([{ user_id: userId, name, description: description || null }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create bucket: ${error.message}`);
  return data;
};

export const getBuckets = async (userId: string): Promise<BucketRow[]> => {
  const { data, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const getBucketById = async (bucketId: string, userId: string): Promise<BucketRow | null> => {
  const { data, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', bucketId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
};

export const updateBucket = async (
  bucketId: string,
  userId: string,
  updates: { name?: string; description?: string }
): Promise<void> => {
  const { error } = await supabase
    .from('buckets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', bucketId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to update bucket: ${error.message}`);
};

export const deleteBucket = async (bucketId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('buckets')
    .delete()
    .eq('id', bucketId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete bucket: ${error.message}`);
};

// ── Bucket Entry Operations ───────────────────────────

export const createBucketEntry = async (
  bucketId: string,
  title: string,
  content: string
): Promise<BucketEntryRow> => {
  const { data, error } = await supabase
    .from('bucket_entries')
    .insert([{ bucket_id: bucketId, title, content }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create entry: ${error.message}`);
  return data;
};

export const getBucketEntries = async (bucketId: string): Promise<BucketEntryRow[]> => {
  const { data, error } = await supabase
    .from('bucket_entries')
    .select('*')
    .eq('bucket_id', bucketId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
};

export const updateBucketEntry = async (
  entryId: string,
  updates: { title?: string; content?: string }
): Promise<void> => {
  const { error } = await supabase
    .from('bucket_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entryId);
  if (error) throw new Error(`Failed to update entry: ${error.message}`);
};

export const deleteBucketEntry = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from('bucket_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw new Error(`Failed to delete entry: ${error.message}`);
};

// ── Conversation–Bucket Junction ──────────────────────

export const attachBucketToConversation = async (
  conversationId: string,
  bucketId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_buckets')
    .upsert([{ conversation_id: conversationId, bucket_id: bucketId }]);
  if (error) throw new Error(`Failed to attach bucket: ${error.message}`);
};

export const detachBucketFromConversation = async (
  conversationId: string,
  bucketId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_buckets')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('bucket_id', bucketId);
  if (error) throw new Error(`Failed to detach bucket: ${error.message}`);
};

export const getConversationBuckets = async (conversationId: string): Promise<BucketRow[]> => {
  const { data: links } = await supabase
    .from('conversation_buckets')
    .select('bucket_id')
    .eq('conversation_id', conversationId);
  if (!links?.length) return [];

  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .in('id', links.map(l => l.bucket_id));
  return buckets || [];
};

export const getBucketContentForContext = async (conversationId: string): Promise<string> => {
  const { data: links } = await supabase
    .from('conversation_buckets')
    .select('bucket_id')
    .eq('conversation_id', conversationId);
  if (!links?.length) return '';

  const bucketIds = links.map(l => l.bucket_id);

  // Fetch buckets and ALL their entries in parallel (2 queries instead of N+2)
  const [{ data: buckets }, { data: allEntries }] = await Promise.all([
    supabase.from('buckets').select('id, name').in('id', bucketIds),
    supabase.from('bucket_entries').select('bucket_id, title, content').in('bucket_id', bucketIds).order('sort_order', { ascending: true }),
  ]);
  if (!buckets?.length) return '';

  // Group entries by bucket_id in a single pass
  const entriesByBucket: Record<string, typeof allEntries> = {};
  for (const entry of allEntries || []) {
    (entriesByBucket[entry.bucket_id] ??= []).push(entry);
  }

  const parts: string[] = [];
  for (const bucket of buckets) {
    const entries = entriesByBucket[bucket.id];
    if (!entries?.length) continue;
    const entryTexts = entries.map(e =>
      e.title ? `## ${e.title}\n${e.content}` : e.content
    ).join('\n\n');
    parts.push(`=== ${bucket.name} ===\n${entryTexts}`);
  }

  const result = parts.join('\n\n');
  if (result.length > 32000) {
    return result.substring(0, 32000) + '\n\n[... truncated for context limit]';
  }
  return result;
};
