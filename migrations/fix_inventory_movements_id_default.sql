-- Migration to fix ID column default value in inventory_movements table
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled (needed for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Alter the id column to have a default value of gen_random_uuid()
ALTER TABLE inventory_movements
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_movements' AND column_name = 'id';
