-- Migration: Add ticket_number to sales table
-- Date: 2025-12-14

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS ticket_number TEXT;

-- Optional: create index to speed up queries by ticket_number
CREATE INDEX IF NOT EXISTS idx_sales_ticket_number ON sales(ticket_number);
