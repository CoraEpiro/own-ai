-- Migration 007: Add reply metadata to chat messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reply_to JSONB;
