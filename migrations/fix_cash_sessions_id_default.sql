-- Migration to fix ID column default value in cash_sessions table
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Alter the id column to have a default value of gen_random_uuid()
-- Note: The application might still provide its own IDs (SES-...), but this prevents errors if it doesn't.
ALTER TABLE cash_sessions
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'cash_sessions' AND column_name = 'id';
