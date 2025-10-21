import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    console.log('🧹 [Cleanup] Iniciando limpieza de duplicados para tienda:', storeId);

    // Obtener todos los productos de la tienda
    const allProducts = await Product.find({ storeId }).lean();
    console.log('📊 [Cleanup] Total de registros encontrados:', allProducts.length);

    // Agrupar por id para encontrar duplicados
    const productMap = new Map<string, any[]>();
    
    for (const product of allProducts) {
      const existing = productMap.get(product.id) || [];
      existing.push(product);
      productMap.set(product.id, existing);
    }

    // Identificar duplicados
    const duplicates: string[] = [];
    const toDelete: string[] = [];
    
    for (const [productId, products] of productMap.entries()) {
      if (products.length > 1) {
        duplicates.push(productId);
        console.log(`🔍 [Cleanup] Producto duplicado encontrado: ${productId} (${products.length} copias)`);
        
        // Mantener el más reciente (último createdAt), eliminar los demás
        const sorted = products.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Eliminar todos excepto el primero (más reciente)
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i]._id.toString());
        }
      }
    }

    console.log('🗑️ [Cleanup] Registros a eliminar:', toDelete.length);

    // Eliminar duplicados
    if (toDelete.length > 0) {
      const deleteResult = await Product.deleteMany({
        _id: { $in: toDelete }
      });
      
      console.log('✅ [Cleanup] Duplicados eliminados:', deleteResult.deletedCount);
    }

    // Obtener conteo final
    const finalCount = await Product.countDocuments({ storeId });

    return NextResponse.json({
      success: true,
      message: 'Limpieza completada',
      stats: {
        initialCount: allProducts.length,
        duplicatesFound: duplicates.length,
        recordsDeleted: toDelete.length,
        finalCount: finalCount,
        uniqueProducts: productMap.size
      }
    });

  } catch (error: any) {
    console.error('❌ [Cleanup] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
