-- Migration 002: Add system_prompt to conversations + attachments to chat_messages
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
