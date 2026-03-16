-- Migration 005: Knowledge Buckets
CREATE TABLE IF NOT EXISTS buckets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Bucket',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buckets_user_id ON buckets(user_id);

CREATE TABLE IF NOT EXISTS bucket_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  entry_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_mime_type TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bucket_entries_bucket_id ON bucket_entries(bucket_id);

-- Many-to-many: conversations <-> buckets
CREATE TABLE IF NOT EXISTS conversation_buckets (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, bucket_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_buckets_conv ON conversation_buckets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_buckets_bucket ON conversation_buckets(bucket_id);
