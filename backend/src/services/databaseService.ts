// Database service for user and chat operations using Supabase
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface User {
  id: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  timestamp: Date;
  model?: string;
  tokens_used?: number;
  cost?: number;
}

// User operations
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
};

export const createUser = async (userData: { email: string; password: string }): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email,
          password: userData.password,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }

    return data;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

// Chat operations
export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return [];
  }
};

export const saveChatMessage = async (
  userId: string, 
  message: string, 
  model?: string, 
  tokensUsed?: number, 
  cost?: number
): Promise<ChatMessage> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          message,
          model,
          tokens_used: tokensUsed,
          cost,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Failed to save chat message');
    }

    return data;
  } catch (error) {
    console.error('Error in saveChatMessage:', error);
    throw error;
  }
};

// Usage tracking
export const getUserUsage = async (userId: string): Promise<{
  totalTokens: number;
  totalCost: number;
  messageCount: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('tokens_used, cost')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user usage:', error);
      return { totalTokens: 0, totalCost: 0, messageCount: 0 };
    }

    const totalTokens = data?.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0) || 0;
    const totalCost = data?.reduce((sum, msg) => sum + (msg.cost || 0), 0) || 0;
    const messageCount = data?.length || 0;

    return { totalTokens, totalCost, messageCount };
  } catch (error) {
    console.error('Error in getUserUsage:', error);
    return { totalTokens: 0, totalCost: 0, messageCount: 0 };
  }
}; 