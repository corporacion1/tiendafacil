import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

/**
 * POST - Migrar productos de imagen única a múltiples imágenes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] Iniciando migración de productos a múltiples imágenes');
    
    await connectToDatabase();
    
    const { storeId } = await request.json();
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🏪 [API] Migrando productos de tienda:', storeId);
    
    // Buscar productos que tienen imageUrl pero no tienen array de images
    const productsToMigrate = await Product.find({
      storeId,
      imageUrl: { $exists: true, $ne: '' },
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    });
    
    console.log(`📦 [API] Encontrados ${productsToMigrate.length} productos para migrar`);
    
    if (productsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay productos que migrar',
        migratedCount: 0,
        totalFound: 0
      });
    }
    
    let migratedCount = 0;
    const errors: string[] = [];
    
    for (const product of productsToMigrate) {
      try {
        console.log(`🔄 [API] Migrando producto: ${product.name} (${product.id})`);
        
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
        const updateResult = await Product.updateOne(
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
          console.log(`✅ [API] Producto migrado: ${product.name}`);
        } else {
          const error = `No se pudo migrar: ${product.name}`;
          console.log(`⚠️ [API] ${error}`);
          errors.push(error);
        }
        
      } catch (error) {
        const errorMsg = `Error migrando producto ${product.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        console.error(`❌ [API] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    logDatabaseOperation('POST', 'migrate-product-images', { 
      storeId, 
      totalFound: productsToMigrate.length,
      migratedCount,
      errorsCount: errors.length
    });
    
    console.log(`🎉 [API] Migración completada: ${migratedCount}/${productsToMigrate.length} productos migrados`);
    
    return NextResponse.json({
      success: true,
      message: `Migración completada: ${migratedCount}/${productsToMigrate.length} productos migrados`,
      migratedCount,
      totalFound: productsToMigrate.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ [API] Error en migración:', error);
    return handleDatabaseError(error, 'POST migrate product images');
  }
}

/**
 * GET - Verificar estado de migración
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // Contar productos con imageUrl pero sin images array
    const needsMigration = await Product.countDocuments({
      storeId,
      imageUrl: { $exists: true, $ne: '' },
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    });
    
    // Contar productos ya migrados (tienen images array)
    const alreadyMigrated = await Product.countDocuments({
      storeId,
      images: { $exists: true, $not: { $size: 0 } }
    });
    
    // Contar productos sin imágenes
    const withoutImages = await Product.countDocuments({
      storeId,
      $and: [
        {
          $or: [
            { imageUrl: { $exists: false } },
            { imageUrl: '' },
            { imageUrl: null }
          ]
        },
        {
          $or: [
            { images: { $exists: false } },
            { images: { $size: 0 } }
          ]
        }
      ]
    });
    
    const total = await Product.countDocuments({ storeId });
    
    return NextResponse.json({
      storeId,
      total,
      needsMigration,
      alreadyMigrated,
      withoutImages,
      migrationNeeded: needsMigration > 0
    });
    
  } catch (error) {
    return handleDatabaseError(error, 'GET migrate product images status');
  }
}