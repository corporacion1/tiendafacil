-- Crear tabla store_security para almacenar configuración de PIN por tienda
CREATE TABLE IF NOT EXISTS store_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    remaining_attempts INTEGER DEFAULT 5,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint (opcional, depende de tu esquema de stores)
    CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas por store_id
CREATE INDEX IF NOT EXISTS idx_store_security_store_id ON store_security(store_id);

-- Comentarios para documentación
COMMENT ON TABLE store_security IS 'Almacena la configuración de seguridad (PIN) por tienda';
COMMENT ON COLUMN store_security.pin_hash IS 'Hash bcrypt del PIN de seguridad';
COMMENT ON COLUMN store_security.remaining_attempts IS 'Intentos restantes antes de bloqueo';
COMMENT ON COLUMN store_security.is_locked IS 'Indica si la tienda está bloqueada por intentos fallidos';
