import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';
import { normalizeAssistantMarkdown } from '../utils/markdown';

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
  is_admin?: boolean;
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
  reply_to?: {
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    selectedText?: string;
  } | null;
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

export const createUser = async (
  userData: { email: string; password: string; isAdmin?: boolean }
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: userData.email,
      password: userData.password,
      is_admin: !!userData.isAdmin,
    }])
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

export const setUserAdmin = async (userId: string, isAdmin: boolean): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ is_admin: isAdmin })
    .eq('id', userId);
  if (error) throw new Error('Failed to update admin role');
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return !!data.is_admin;
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

export const getConversationMessageById = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<ChatMessageRow | null> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
};

export const saveConversationMessage = async (
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  model?: string,
  tokensUsed?: number,
  cost?: number,
  attachments?: any[],
  replyTo?: { messageId: string; role: 'user' | 'assistant'; content: string; selectedText?: string } | null,
): Promise<ChatMessageRow> => {
  const normalizedContent = role === 'assistant'
    ? normalizeAssistantMarkdown(content || '')
    : (content || '');
  const safeContent = sanitizeStringForDb(normalizedContent);
  const safeAttachments = attachments?.length
    ? (sanitizeJsonValueForDb(attachments) as any[])
    : undefined;
  const safeReplyTo = replyTo
    ? (sanitizeJsonValueForDb({
      messageId: replyTo.messageId,
      role: replyTo.role,
      content: replyTo.content,
      ...(replyTo.selectedText ? { selectedText: replyTo.selectedText } : {}),
    }) as any)
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
      ...(safeReplyTo ? { reply_to: safeReplyTo } : {}),
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

// ── Admin Operations ──────────────────────────────────

export interface AdminUserSummary {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  lastActiveAt: string | null;
  balance: number | null;
}

export interface AdminFeedbackRow {
  id: string;
  user_id: string | null;
  type: 'suggestion' | 'report';
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTransactionRow {
  id: string;
  user_id: string | null;
  type: 'usage_charge' | 'credit' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  scheduled_for: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const getAdminUsersOverview = async (): Promise<AdminUserSummary[]> => {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (usersError || !users?.length) return [];

  const userIds = users.map(u => u.id);
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('user_id, tokens_used, cost, timestamp')
    .in('user_id', userIds);

  const stats: Record<string, {
    messageCount: number;
    totalTokens: number;
    totalCost: number;
    lastActiveAt: string | null;
  }> = {};

  for (const row of messages || []) {
    const current = stats[row.user_id] ??= {
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
      lastActiveAt: null,
    };

    current.messageCount += 1;
    current.totalTokens += row.tokens_used || 0;
    current.totalCost += row.cost || 0;
    if (!current.lastActiveAt || (row.timestamp && row.timestamp > current.lastActiveAt)) {
      current.lastActiveAt = row.timestamp || current.lastActiveAt;
    }
  }

  return users.map((user: any) => ({
    id: user.id,
    email: user.email,
    isAdmin: !!user.is_admin,
    createdAt: user.created_at,
    messageCount: stats[user.id]?.messageCount || 0,
    totalTokens: stats[user.id]?.totalTokens || 0,
    totalCost: stats[user.id]?.totalCost || 0,
    lastActiveAt: stats[user.id]?.lastActiveAt || null,
    balance: null,
  }));
};

export const getAdminOverview = async () => {
  const [usersRes, messagesRes, feedbackRes, txRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('cost', { count: 'exact' }),
    supabase.from('admin_feedback').select('id, status'),
    supabase.from('admin_transactions').select('id, status'),
  ]);

  const totalUsers = usersRes.count || 0;
  const totalMessages = messagesRes.count || 0;
  const totalCost = (messagesRes.data || []).reduce((sum, row: any) => sum + (row.cost || 0), 0);

  const feedback = feedbackRes.data || [];
  const transactions = txRes.data || [];

  return {
    totalUsers,
    totalMessages,
    totalCost,
    openFeedback: feedback.filter((f: any) => f.status === 'open' || f.status === 'in_review').length,
    pendingTransactions: transactions.filter((t: any) => t.status === 'pending').length,
  };
};

export const createUserFeedback = async (
  userId: string | null,
  type: 'suggestion' | 'report',
  subject: string,
  message: string
): Promise<AdminFeedbackRow> => {
  const safeSubject = sanitizeStringForDb(subject).trim().slice(0, 200);
  const safeMessage = sanitizeStringForDb(message).trim().slice(0, 5000);

  const { data, error } = await supabase
    .from('admin_feedback')
    .insert([{
      user_id: userId,
      type,
      subject: safeSubject,
      message: safeMessage,
      status: 'open',
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create feedback: ${error.message}`);
  return data;
};

export const getAdminFeedback = async (): Promise<AdminFeedbackRow[]> => {
  const { data, error } = await supabase
    .from('admin_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
};

export const updateAdminFeedback = async (
  feedbackId: string,
  updates: { status?: AdminFeedbackRow['status']; adminNote?: string }
): Promise<void> => {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status) payload.status = updates.status;
  if (typeof updates.adminNote === 'string') {
    payload.admin_note = sanitizeStringForDb(updates.adminNote).slice(0, 2000);
  }

  const { error } = await supabase
    .from('admin_feedback')
    .update(payload)
    .eq('id', feedbackId);
  if (error) throw new Error(`Failed to update feedback: ${error.message}`);
};

export const createAdminTransaction = async (input: {
  userId?: string | null;
  type: AdminTransactionRow['type'];
  amount: number;
  currency?: string;
  status?: AdminTransactionRow['status'];
  description: string;
  scheduledFor?: string | null;
  metadata?: Record<string, any>;
}): Promise<AdminTransactionRow> => {
  const { data, error } = await supabase
    .from('admin_transactions')
    .insert([{
      user_id: input.userId || null,
      type: input.type,
      amount: input.amount,
      currency: (input.currency || 'USD').toUpperCase(),
      status: input.status || 'pending',
      description: sanitizeStringForDb(input.description).slice(0, 500),
      scheduled_for: input.scheduledFor || null,
      metadata: sanitizeJsonValueForDb(input.metadata || {}),
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return data;
};

export const getAdminTransactions = async (): Promise<AdminTransactionRow[]> => {
  const { data, error } = await supabase
    .from('admin_transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const updateAdminTransaction = async (
  transactionId: string,
  updates: {
    status?: AdminTransactionRow['status'];
    scheduledFor?: string | null;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> => {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status) payload.status = updates.status;
  if (updates.scheduledFor !== undefined) payload.scheduled_for = updates.scheduledFor;
  if (typeof updates.description === 'string') payload.description = sanitizeStringForDb(updates.description).slice(0, 500);
  if (updates.metadata) payload.metadata = sanitizeJsonValueForDb(updates.metadata);

  const { error } = await supabase
    .from('admin_transactions')
    .update(payload)
    .eq('id', transactionId);
  if (error) throw new Error(`Failed to update transaction: ${error.message}`);
};
