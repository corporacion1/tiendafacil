-- Migration to align cash_sessions table with application schema
-- Run this in your Supabase SQL Editor

-- Add missing columns to cash_sessions table to match TypeScript definition
ALTER TABLE cash_sessions
ADD COLUMN IF NOT EXISTS opening_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS closing_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS calculated_cash NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS difference NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_by TEXT,
ADD COLUMN IF NOT EXISTS closed_by TEXT,
ADD COLUMN IF NOT EXISTS sales_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transactions JSONB DEFAULT '{}'::jsonb;

-- Create index on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_id ON cash_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opening_date ON cash_sessions(opening_date DESC);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cash_sessions'
ORDER BY ordinal_position;
