import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, validateRequiredFields, logDatabaseOperation } from '@/lib/db-error-handler';

/**
 * GET - Obtener un producto específico por ID
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
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🔍 [API] GET producto:', { id: productId, storeId });
    
    const product = await Product.findOne({ id: productId, storeId }).lean();
    
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    logDatabaseOperation('GET', 'product-by-id', { productId, storeId });
    
    return NextResponse.json(product);
    
  } catch (error) {
    return handleDatabaseError(error, 'GET product by id');
  }
}

/**
 * PUT - Actualizar un producto específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const productId = params.id;
    const data = await request.json();
    
    console.log('📥 [API] PUT producto:', { id: productId, storeId: data.storeId });
    console.log('📦 [API] Datos recibidos:', {
      name: data.name,
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      imageUrl: data.imageUrl,
      primaryImageIndex: data.primaryImageIndex
    });
    
    const validationError = validateRequiredFields(data, ['storeId']);
    if (validationError) {
      console.error('❌ [API] Error de validación:', validationError);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    
    // Asegurar que el ID en los datos coincida con el parámetro
    data.id = productId;
    
    logDatabaseOperation('PUT', 'product-by-id', { productId, storeId: data.storeId });
    
    console.log('🔄 [API] Actualizando producto en BD...');
    
    const updated = await Product.findOneAndUpdate(
      { id: productId, storeId: data.storeId },
      { $set: data },
      { new: true, runValidators: true }
    );
    
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
    return handleDatabaseError(error, 'PUT product by id');
  }
}

/**
 * DELETE - Eliminar un producto específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🗑️ [API] DELETE producto:', { id: productId, storeId });
    
    logDatabaseOperation('DELETE', 'product-by-id', { productId, storeId });
    
    const deleted = await Product.findOneAndDelete({ id: productId, storeId });
    
    if (!deleted) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API] Producto eliminado exitosamente:', productId);
    
    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente',
      deletedProduct: { id: deleted.id, name: deleted.name }
    });
    
  } catch (error) {
    return handleDatabaseError(error, 'DELETE product by id');
  }
}