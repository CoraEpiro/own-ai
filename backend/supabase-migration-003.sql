-- Migration 003: Add bio column for user custom instructions
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
