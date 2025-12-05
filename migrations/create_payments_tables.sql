-- Create payments table for tracking general expenses
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_id TEXT,  -- Tax ID, RIF, or identification number
  recipient_phone TEXT,
  category TEXT NOT NULL CHECK (category IN ('rent', 'fuel', 'consumables', 'raw_materials', 'utilities', 'other')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'primary',
  document_number TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'check', 'other')),
  notes TEXT,
  responsible TEXT NOT NULL,  -- Person who made the payment
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_recipients table for managing recipients
CREATE TABLE IF NOT EXISTS payment_recipients (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_id TEXT,  -- RIF, NIT, or tax identification
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_store_id ON payments(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(category);
CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient_name);
CREATE INDEX IF NOT EXISTS idx_payment_recipients_store_id ON payment_recipients(store_id);

-- Create trigger for updated_at on payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Create trigger for updated_at on payment_recipients
CREATE OR REPLACE FUNCTION update_payment_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_recipients_updated_at
  BEFORE UPDATE ON payment_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_recipients_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Records of general business expenses (rent, fuel, consumables, etc.)';
COMMENT ON TABLE payment_recipients IS 'Recipients for payments (landlords, fuel stations, suppliers, etc.)';
COMMENT ON COLUMN payments.category IS 'Type of expense: rent, fuel, consumables, raw_materials, utilities, other';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: cash, transfer, card, check, other';
