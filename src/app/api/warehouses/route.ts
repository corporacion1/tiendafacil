
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
    const transformedWarehouses = warehouses?.map(w => ({
      id: w.id,
      storeId: w.store_id,
      name: w.name,
      address: w.address,
      description: w.description,
      isDefault: w.is_default,
      isActive: w.is_active,
      createdAt: w.created_at,
      updatedAt: w.updated_at
    })) || [];

    return NextResponse.json(transformedWarehouses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('warehouse');
    }

    if (!data.name || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const warehouseData = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      address: data.address,
      description: data.description,
      is_default: data.isDefault || false,
      is_active: data.isActive !== undefined ? data.isActive : true
    };

    const { data: created, error } = await supabaseAdmin
      .from('warehouses')
      .insert([warehouseData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      address: created.address,
      description: created.description,
      isDefault: created.is_default,
      isActive: created.is_active,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
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
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

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
      address: updated.address,
      description: updated.description,
      isDefault: updated.is_default,
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
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