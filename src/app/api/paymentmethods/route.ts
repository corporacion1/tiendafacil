import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const { data: paymentMethods, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase
    const transformedMethods = paymentMethods?.map((pm: any) => ({
      id: pm.id,
      storeId: pm.store_id,
      name: pm.name,
      description: pm.description,
      isActive: pm.is_active,
      createdAt: pm.created_at,
      updatedAt: pm.updated_at
    })) || [];

    return NextResponse.json(transformedMethods);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('pm');
    }

    if (!data.name || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const methodData = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      description: data.description,
      is_active: data.isActive !== undefined ? data.isActive : true
    };

    const { data: created, error } = await supabaseAdmin
      .from('payment_methods')
      .insert([methodData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      description: created.description,
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
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: updated, error } = await supabaseAdmin
      .from('payment_methods')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });

    // Transformar respuesta
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      description: updated.description,
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
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
