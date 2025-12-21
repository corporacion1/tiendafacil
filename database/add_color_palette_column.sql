-- Script para agregar la columna color_palette a la tabla stores
-- Fecha: 2025-12-20
-- Descripción: Permite a cada tienda personalizar su paleta de colores

-- 1. Agregar columna color_palette a la tabla stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS color_palette VARCHAR(50) DEFAULT 'blue-orange';

-- 2. Comentario descriptivo de la columna
COMMENT ON COLUMN stores.color_palette IS 'Paleta de colores de la tienda. Opciones: blue-orange (default), purple-pink, green-teal, red-yellow, indigo-cyan, slate-amber';

-- 3. Actualizar registros existentes con el valor por defecto (blue-orange es la paleta actual de tiendafacil)
UPDATE stores 
SET color_palette = 'blue-orange' 
WHERE color_palette IS NULL OR color_palette = '';

-- 4. Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name = 'color_palette';

-- 5. Verificar los datos actualizados
SELECT 
    store_id,
    name,
    color_palette
FROM stores
LIMIT 10;
