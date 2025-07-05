-- Supabase schema for Own AI application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    model VARCHAR(100),
    tokens_used INTEGER,
    cost DECIMAL(10, 6),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS policies for chat_messages table
CREATE POLICY "Users can view their own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 