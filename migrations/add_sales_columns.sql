-- Add missing columns to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update existing records to have reasonable defaults (optional, but good for data integrity)
-- Set subtotal = total if subtotal is 0 (assuming no tax/discount for old records)
UPDATE public.sales
SET subtotal = total
WHERE subtotal = 0;

-- Comment on columns
COMMENT ON COLUMN public.sales.subtotal IS 'Sale subtotal before tax and discount';
COMMENT ON COLUMN public.sales.tax IS 'Total tax amount';
COMMENT ON COLUMN public.sales.discount IS 'Total discount amount';
COMMENT ON COLUMN public.sales.payment_method IS 'Primary payment method or "Multiple"';
