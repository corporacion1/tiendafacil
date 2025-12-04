import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const { data: suppliers, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase
    const transformedSuppliers = suppliers?.map((s: any) => ({
      id: s.id,
      storeId: s.store_id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    })) || [];

    return NextResponse.json(transformedSuppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('supplier');
    }

    if (!data.name || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case - solo campos que existen en la tabla
    const supplierData = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      phone: data.phone || null,
      address: data.address || null
    };

    const { data: created, error } = await supabaseAdmin
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) throw error;

    // Transform response to camelCase
    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      phone: created.phone,
      address: created.address,
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

    // Map fields to update - only existing columns
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;

    const { data: updated, error } = await supabaseAdmin
      .from('suppliers')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

    // Transform response to camelCase
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
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
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
