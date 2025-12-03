
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const { data: warehouses, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase
    const transformedWarehouses = warehouses?.map((w: any) => ({
      id: w.id,
      storeId: w.store_id,
      name: w.name,
      status: w.status,
      createdAt: w.created_at
    })) || [];

    return NextResponse.json(transformedWarehouses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('📦 [Warehouses API] POST received:', data);

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('warehouse');
    }

    if (!data.name || !data.storeId) {
      console.error('❌ [Warehouses API] Missing required fields:', { name: data.name, storeId: data.storeId });
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const warehouseData = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      status: data.status || 'active',
      created_at: new Date().toISOString()
    };

    console.log('📤 [Warehouses API] Inserting warehouse:', warehouseData);

    const { data: created, error } = await supabaseAdmin
      .from('warehouses')
      .insert([warehouseData])
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
      status: created.status,
      createdAt: created.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Warehouses API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }

    // Mapear campos a actualizar
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await supabaseAdmin
      .from('warehouses')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Almacén no encontrado" }, { status: 404 });

    // Transformar respuesta
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      status: updated.status,
      createdAt: updated.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
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

    const { error } = await supabaseAdmin
      .from('warehouses')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}