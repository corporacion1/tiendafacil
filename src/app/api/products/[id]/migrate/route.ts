import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * POST - Migrar un producto específico de imagen única a múltiples imágenes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const productId = params.id;
    const { storeId } = await request.json();
    
    console.log('🔄 [Migrate] Iniciando migración del producto:', { productId, storeId });
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // Buscar el producto
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('📦 [Migrate] Producto encontrado:', product.name);
    
    // Verificar si ya está migrado
    if (product.images && product.images.length > 0) {
      console.log('✅ [Migrate] Producto ya está migrado');
      return NextResponse.json({
        success: true,
        message: 'Producto ya está migrado',
        alreadyMigrated: true,
        imagesCount: product.images.length,
        product: product
      });
    }
    
    // Verificar si tiene imageUrl para migrar
    if (!product.imageUrl) {
      console.log('⚠️ [Migrate] Producto no tiene imageUrl para migrar');
      return NextResponse.json({
        success: true,
        message: 'Producto no tiene imagen para migrar',
        noImageToMigrate: true,
        product: product
      });
    }
    
    // Crear imagen migrada
    const migratedImage = {
      id: `migrated-${Date.now()}`,
      url: product.imageUrl,
      thumbnailUrl: product.imageUrl,
      alt: product.imageHint || product.name,
      order: 0,
      uploadedAt: new Date().toISOString(),
      size: 0, // Tamaño desconocido para imágenes migradas
      dimensions: {
        width: 800,
        height: 600
      }
      // No tiene supabasePath porque es una imagen legacy
    };
    
    console.log('🖼️ [Migrate] Imagen migrada creada:', migratedImage);
    
    // Actualizar producto
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { 
        $set: { 
          images: [migratedImage],
          primaryImageIndex: 0
          // Mantener imageUrl e imageHint para compatibilidad
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
    }
    
    console.log('✅ [Migrate] Migración completada exitosamente');
    
    return NextResponse.json({
      success: true,
      message: 'Producto migrado exitosamente',
      migrated: true,
      imagesCount: updatedProduct.images?.length || 0,
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('❌ [Migrate] Error en migración:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}