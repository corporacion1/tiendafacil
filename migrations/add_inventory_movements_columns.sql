-- Migration to add missing columns to inventory_movements table
-- Run this in your Supabase SQL Editor

-- Add missing columns to inventory_movements table
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS previous_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS batch_id TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on commonly queried fields for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_id ON inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_id ON inventory_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_movements_updated_at ON inventory_movements;
CREATE TRIGGER trigger_update_inventory_movements_updated_at
    BEFORE UPDATE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_movements_updated_at();

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_movements'
ORDER BY ordinal_position;
