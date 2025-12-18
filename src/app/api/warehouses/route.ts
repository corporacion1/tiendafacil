import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/warehouses - Obtener almacenes por storeId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    console.log(' [Warehouses API] GET warehouses for store:', storeId);

    const { data: warehouses, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: false });

   if (error) {
      console.error(' [warehouses API] Error fetching warehouses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformar snake_case a camelCase
    const transformedWarehouses = (warehouses || []).map((w: any) => ({
      id: w.id,
      storeId: w.store_id,
      name: w.name,
      location: w.location,
      status: w.status,
      createdAt: w.created_at
    })) || [];

    console.log(` [Warehouses API] Returned ${transformedWarehouses.length} warehouses`);
    return NextResponse.json(transformedWarehouses);
  } catch (error: any) {
    console.error(' [Warehouses API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/warehouses - Crear nuevo almacén
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    console.log('📥 [Warehouses API] Creating warehouse:', body.name);

    // Mapear a snake_case
    const warehouseData = {
      id: IDGenerator.generate('warehouse'),
      store_id: body.storeId,
      name: body.name,
      location: body.location || null
    };

    const { data: created, error } = await supabaseAdmin
      .from('warehouses')
      .insert(warehouseData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Warehouses API] Supabase error:', error);
      throw error;
    }

    console.log('✅ [Warehouses API] Warehouse created:', created);

    // Transformar respuesta
    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      location: created.location,
      status: created.status,
      createdAt: created.created_at
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('❌ [Warehouses API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/warehouses - Actualizar almacén
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Campos requeridos 'id'" }, { status: 400 });
    }

    console.log('🔄 [Warehouses API] Updating warehouse:', body.id);

    // Mapear campos a actualizar
    const dbupdateData: any = {};
    if (updateData.name !== undefined) dbupdateData.name = updateData.name;
    if (updateData.status !== undefined) dbupdateData.status = updateData.status;
    if (updateData.location !== undefined) dbupdateData.location = updateData.location;

    const { data: updated, error } = await supabaseAdmin
      .from('warehouses')
      .update(dbupdateData)
      .eq('id', id)
      .select()
      .single();

    if (error){
      console.error('❌ [Warehouses API] Error updating warehouse:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('✅ [Warehouses API] Warehouse updated:', updated.id);

    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      location: updated.location,
      status: updated.status,
      createdAt: updated.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Warehouses API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/warehouses - Eliminar almacén
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }

    console.log(' [Warehouses API] DELETE warehouse:', id);

    const { data,error } = await supabaseAdmin
      .from('warehouses')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error){
      console.error(' [Warehouses API] Error deleting warehouse:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Warehouses API] Warehouse deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(' [Warehouses API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}