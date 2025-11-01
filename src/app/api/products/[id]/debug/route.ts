import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * GET - Debug: Ver estado actual de un producto
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    console.log('🔍 [Debug] Consultando producto:', { productId, storeId });
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    const product = await Product.findOne({ id: productId, storeId });
    
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    const debugInfo = {
      productId: product.id,
      productName: product.name,
      storeId: product.storeId,
      
      // Información de imágenes
      hasImageUrl: !!product.imageUrl,
      imageUrl: product.imageUrl,
      imageHint: product.imageHint,
      
      // Información de múltiples imágenes
      hasImagesArray: !!product.images,
      imagesCount: product.images?.length || 0,
      primaryImageIndex: product.primaryImageIndex,
      
      // Detalles de cada imagen
      images: product.images?.map((img, index) => ({
        index,
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
        supabasePath: img.supabasePath,
        isPrimary: index === (product.primaryImageIndex || 0)
      })) || [],
      
      // Documento completo (para debug)
      fullDocument: product
    };
    
    console.log('📊 [Debug] Info del producto:', debugInfo);
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ [Debug] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}