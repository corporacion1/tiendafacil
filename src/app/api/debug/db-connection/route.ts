import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * GET - Debug: Verificar conexión a la base de datos
 */
export async function GET() {
  try {
    console.log('🔍 [Debug DB] Iniciando verificación de conexión...');
    
    // Verificar conexión
    await connectToDatabase();
    console.log('✅ [Debug DB] Conexión a MongoDB exitosa');
    
    // Contar productos totales
    const totalProducts = await Product.countDocuments();
    console.log(`📊 [Debug DB] Total de productos: ${totalProducts}`);
    
    // Contar productos con imágenes múltiples
    const productsWithMultipleImages = await Product.countDocuments({
      images: { $exists: true, $not: { $size: 0 } }
    });
    
    // Contar productos con imageUrl legacy
    const productsWithLegacyImage = await Product.countDocuments({
      imageUrl: { $exists: true, $ne: '' }
    });
    
    // Obtener algunos productos de ejemplo
    const sampleProducts = await Product.find({})
      .limit(3)
      .select('id name imageUrl images primaryImageIndex storeId')
      .lean();
    
    console.log('📋 [Debug DB] Productos de ejemplo:', sampleProducts);
    
    // Información del entorno
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      mongodbUri: process.env.MONGODB_URI ? 'Configurado' : 'No configurado',
      timestamp: new Date().toISOString()
    };
    
    const result = {
      success: true,
      connection: 'OK',
      environment,
      statistics: {
        totalProducts,
        productsWithMultipleImages,
        productsWithLegacyImage,
        productsWithoutImages: totalProducts - productsWithMultipleImages - productsWithLegacyImage
      },
      sampleProducts: sampleProducts.map(product => ({
        id: product.id,
        name: product.name,
        storeId: product.storeId,
        hasLegacyImage: !!product.imageUrl,
        hasMultipleImages: !!(product.images && product.images.length > 0),
        imageCount: product.images ? product.images.length : (product.imageUrl ? 1 : 0),
        primaryImageIndex: product.primaryImageIndex
      }))
    };
    
    console.log('✅ [Debug DB] Verificación completada exitosamente');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ [Debug DB] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      connection: 'FAILED',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}