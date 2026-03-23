-- Migration 006: Admin capabilities

-- Admin role flag on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Suggestions / reports inbox
CREATE TABLE IF NOT EXISTS admin_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'report')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_feedback_created_at ON admin_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_status ON admin_feedback(status);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_user_id ON admin_feedback(user_id);

-- Future transactions (balance logic can attach later)
CREATE TABLE IF NOT EXISTS admin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('usage_charge', 'credit', 'refund', 'adjustment')),
  amount NUMERIC(12, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT NOT NULL DEFAULT '',
  scheduled_for TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_transactions_created_at ON admin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_transactions_status ON admin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_admin_transactions_user_id ON admin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_transactions_scheduled_for ON admin_transactions(scheduled_for);

