-- Migration to fix ID column default value in products table
-- This ensures that products can be inserted without explicitly providing an ID

-- Set default value for id column to generate UUID
ALTER TABLE products
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Verify the change
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'id';

-- Test: Try inserting a product without ID (should work now)
-- Uncomment to test:
-- INSERT INTO products (store_id, name, price, stock) 
-- VALUES ('test_store', 'Test Product', 100, 10);
