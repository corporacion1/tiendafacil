/**
 * Script de migración para convertir productos con imagen única a múltiples imágenes
 * Ejecutar con: node scripts/migrate-products-to-multiple-images.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiendafacil';

async function migrateProducts() {
  console.log('🚀 Iniciando migración de productos a múltiples imágenes...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const collection = db.collection('products');
    
    // Buscar productos que tienen imageUrl pero no tienen array de images
    const productsToMigrate = await collection.find({
      imageUrl: { $exists: true, $ne: '' },
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    }).toArray();
    
    console.log(`📦 Encontrados ${productsToMigrate.length} productos para migrar`);
    
    if (productsToMigrate.length === 0) {
      console.log('✅ No hay productos que migrar');
      return;
    }
    
    let migratedCount = 0;
    
    for (const product of productsToMigrate) {
      try {
        console.log(`🔄 Migrando producto: ${product.name} (${product.id})`);
        
        // Crear el objeto de imagen migrada
        const migratedImage = {
          id: `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          url: product.imageUrl,
          thumbnailUrl: product.imageUrl, // Usar la misma URL por ahora
          alt: product.imageHint || product.name,
          order: 0,
          uploadedAt: product.createdAt || new Date().toISOString(),
          size: 0, // Tamaño desconocido para imágenes migradas
          dimensions: {
            width: 800,
            height: 600
          }
          // No incluir supabasePath porque es una imagen legacy
        };
        
        // Actualizar el producto
        const updateResult = await collection.updateOne(
          { _id: product._id },
          {
            $set: {
              images: [migratedImage],
              primaryImageIndex: 0
            }
          }
        );
        
        if (updateResult.modifiedCount === 1) {
          migratedCount++;
          console.log(`✅ Producto migrado: ${product.name}`);
        } else {
          console.log(`⚠️ No se pudo migrar: ${product.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrando producto ${product.name}:`, error);
      }
    }
    
    console.log(`🎉 Migración completada: ${migratedCount}/${productsToMigrate.length} productos migrados`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateProducts().catch(console.error);
}

module.exports = { migrateProducts };