-- Migration: add optional customer contact fields to sales
-- Adds columns: customer_phone, customer_address, customer_card_id

ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_card_id TEXT;

-- Optional: add indexes for faster lookups by card id or phone (uncomment if desired)
-- CREATE INDEX IF NOT EXISTS idx_sales_customer_card_id ON sales (customer_card_id);
-- CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales (customer_phone);
