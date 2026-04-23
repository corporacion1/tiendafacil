import { NextResponse, NextRequest } from 'next/server';
import { dbAdmin as db } from '@/lib/db-client';

/**
 * GET - Obtener un producto específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🔍 [API] GET producto DB:', { id: productId, storeId });
    
    // ✅ CORREGIDO: Usar Database en lugar de MongoDB
    const { data: product, error } = await db
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();
    
    if (error) {
      console.error('❌ [API] Error DB GET:', error);
      return NextResponse.json({ error: 'Error al buscar producto' }, { status: 500 });
    }
    
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API] Producto encontrado:', product.id);
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('❌ [API] Error en GET producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT - Actualizar un producto específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const data = await request.json();
    
    console.log('📥 [API] PUT producto DB:', { id: productId, storeId: data.storeId });
    console.log('📦 [API] Datos recibidos:', {
      name: data.name,
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      imageUrl: data.imageUrl,
      primaryImageIndex: data.primaryImageIndex
    });
    
    // Validación básica
    if (!data.storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // ✅ CORREGIDO: Mapear campos de MongoDB a Database
    const updateData = {
      name: data.name,
      sku: data.sku,
      price: data.price,
      wholesale_price: data.wholesalePrice,
      cost: data.cost,
      stock: data.stock,
      status: data.status,
      tax1: data.tax1,
      tax2: data.tax2,
      unit: data.unit,
      family: data.family,
      warehouse: data.warehouse,
      description: data.description,
      image_url: data.imageUrl,
      image_hint: data.imageHint,
      images: data.images,
      primary_image_index: data.primaryImageIndex,
      type: data.type,
      affects_inventory: data.affectsInventory,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔄 [API] Actualizando producto en DB...');
    
    // ✅ CORREGIDO: Usar Database en lugar de MongoDB
    const { data: updated, error } = await db
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('store_id', data.storeId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ [API] Error DB PUT:', error);
      return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
    }
    
    if (!updated) {
      console.error('❌ [API] Producto no encontrado para actualizar');
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API] Producto actualizado exitosamente:', {
      id: updated.id,
      name: updated.name,
      imagesCount: updated.images?.length || 0
    });
    
    return NextResponse.json(updated);
    
  } catch (error) {
    console.error('❌ [API] Error en PUT producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar un producto específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🗑️ [API] DELETE producto DB:', { id: productId, storeId });
    
    // ✅ CORREGIDO: Usar Database en lugar de MongoDB
    const { data: deleted, error } = await db
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ [API] Error DB DELETE:', error);
      return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
    }
    
    if (!deleted) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API] Producto eliminado exitosamente:', productId);
    
    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente',
      deletedProduct: { id: deleted.id, name: deleted.name }
    });
    
  } catch (error) {
    console.error('❌ [API] Error en DELETE producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}