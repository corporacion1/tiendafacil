-- Migration to add affects_inventory to products table
-- Run this in your Supabase SQL Editor

-- Add affects_inventory column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS affects_inventory BOOLEAN DEFAULT true;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'affects_inventory';
