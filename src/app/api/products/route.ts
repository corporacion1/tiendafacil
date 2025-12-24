import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// MODIFICAR el GET en /app/api/products/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    console.log(`🔍 [Products API] Fetching data for store: ${storeId}`);

        const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Products API] Supabase error:', error);
      throw error;
    }

    // Transformar como ya tenías
    const transformedProducts = products?.map((p: any) => ({
      id: p.id,
      storeId: p.store_id,
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      family: p.family,
      price: parseFloat(p.price) || 0,
      wholesalePrice: parseFloat(p.wholesale_price) || 0,
      cost: parseFloat(p.cost) || 0,
      stock: p.stock || 0,
      minStock: p.min_stock || 0,
      unit: p.unit,
      type: p.type,
      status: p.status,
      imageUrl: p.image_url,
      imageHint: p.image_hint,
      // ✅ IMPORTANTE: Asegurar que warehouse se incluya
      warehouse: p.warehouse,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
      primaryImageIndex: p.primary_image_index || 0,
      tax1: p.tax1 || false,
      tax2: p.tax2 || false,
      affectsInventory: p.affects_inventory !== undefined ? p.affects_inventory : true,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    })) || [];

    console.log(`✅ [Products API] Returned ${transformedProducts.length} products`);

    return NextResponse.json(transformedProducts);

  } catch (error: any) {
    console.error('❌ [Products API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Función auxiliar para transformar
function transformProducts(products: any[]) {
  return products?.map((p: any) => ({
    id: p.id,
    storeId: p.store_id,
    sku: p.sku,
    name: p.name,
    description: p.description || '',
    family: p.family,
    price: parseFloat(p.price) || 0,
    wholesalePrice: parseFloat(p.wholesale_price) || 0,
    cost: parseFloat(p.cost) || 0,
    stock: p.stock || 0,
    minStock: p.min_stock || 0,
    unit: p.unit,
    type: p.type,
    status: p.status,
    imageUrl: p.image_url,
    imageHint: p.image_hint,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
    primaryImageIndex: p.primary_image_index || 0,
    tax1: p.tax1 || false,
    tax2: p.tax2 || false,
    warehouse: p.warehouse,
    affectsInventory: p.affects_inventory !== undefined ? p.affects_inventory : true,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  })) || [];
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('📥 [Products API] POST - Received data:', JSON.stringify(data, null, 2));

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('product');
    }

    if (!data.name || !data.storeId) {
      console.error('❌ [Products API] Missing required fields:', { name: data.name, storeId: data.storeId });
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    console.log('📦 [Products API] POST product:', data.name, 'for store:', data.storeId);

    const initialStock = Number(data.stock) || 0;

    // Transformar camelCase a snake_case para Supabase
    const productData = {
      id: data.id,
      store_id: data.storeId,
      sku: data.sku || null,
      name: data.name,
      description: data.description || null,
      family: data.family || null,
      price: parseFloat(data.price) || 0,
      wholesale_price: parseFloat(data.wholesalePrice) || 0,
      cost: parseFloat(data.cost) || 0,
      stock: initialStock,
      min_stock: parseInt(data.minStock) || 0,
      unit: data.unit || null,
      type: data.type || 'product',
      status: data.status || 'active',
      image_url: data.imageUrl,
      image_hint: data.imageHint,
      images: JSON.stringify(data.images || []),
      primary_image_index: data.primaryImageIndex || 0,
      tax1: data.tax1 || false,
      tax2: data.tax2 || false,
      warehouse: data.warehouse || null,
      affects_inventory: data.affectsInventory !== undefined ? data.affectsInventory : true
    };

    console.log('📤 [Products API] Inserting product data:', JSON.stringify(productData, null, 2));

    const { data: created, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Products API] Error creating product:', error);
      console.error('❌ [Products API] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Products API] Product created:', created.id);

    // Transformar respuesta a camelCase
    const response = {
      id: created.id,
      storeId: created.store_id,
      sku: created.sku,
      name: created.name,
      description: created.description,
      family: created.family,
      price: parseFloat(created.price),
      wholesalePrice: parseFloat(created.wholesale_price),
      cost: parseFloat(created.cost),
      stock: created.stock,
      minStock: created.min_stock,
      unit: created.unit,
      type: created.type,
      status: created.status,
      imageUrl: created.image_url,
      imageHint: created.image_hint,
      images: typeof created.images === 'string' ? JSON.parse(created.images) : created.images || [],
      primaryImageIndex: created.primary_image_index,
      tax1: created.tax1,
      tax2: created.tax2,
      warehouse: created.warehouse,
      affectsInventory: created.affects_inventory,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Products API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('📥 [Products API] PUT received:', { id: data.id, storeId: data.storeId });

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: 'id y storeId son requeridos' }, { status: 400 });
    }

    // Transformar camelCase a snake_case
    const updateData: any = {
      store_id: data.storeId,
      updated_at: new Date().toISOString()
    };

    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.family !== undefined) updateData.family = data.family;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.wholesalePrice !== undefined) updateData.wholesale_price = parseFloat(data.wholesalePrice);
    if (data.cost !== undefined) updateData.cost = parseFloat(data.cost);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.minStock !== undefined) updateData.min_stock = parseInt(data.minStock);
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.imageHint !== undefined) updateData.image_hint = data.imageHint;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.primaryImageIndex !== undefined) updateData.primary_image_index = data.primaryImageIndex;
    if (data.tax1 !== undefined) updateData.tax1 = data.tax1;
    if (data.tax2 !== undefined) updateData.tax2 = data.tax2;
    if (data.warehouse !== undefined) updateData.warehouse = data.warehouse;
    if (data.affectsInventory !== undefined) updateData.affects_inventory = data.affectsInventory;

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Products API] Error updating product:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Products API] Product updated:', updated.id);

    // Transformar respuesta a camelCase
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      sku: updated.sku,
      name: updated.name,
      description: updated.description,
      family: updated.family,
      price: parseFloat(updated.price),
      wholesalePrice: parseFloat(updated.wholesale_price),
      cost: parseFloat(updated.cost),
      stock: updated.stock,
      minStock: updated.min_stock,
      unit: updated.unit,
      type: updated.type,
      status: updated.status,
      imageUrl: updated.image_url,
      imageHint: updated.image_hint,
      images: typeof updated.images === 'string' ? JSON.parse(updated.images) : [],
      primaryImageIndex: updated.primary_image_index,
      tax1: updated.tax1,
      tax2: updated.tax2,
      warehouse: updated.warehouse,
      affectsInventory: updated.affects_inventory,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Products API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }

    console.log('🗑️ [Products API] DELETE product:', { id, storeId });

    const { data, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Products API] Error deleting product:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Producto no existe' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Products API] Product deleted:', id);
    return NextResponse.json({ message: 'Producto eliminado exitosamente' });
  } catch (error: any) {
    console.error('❌ [Products API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
