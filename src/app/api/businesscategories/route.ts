import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const { data: categories, error } = await supabaseAdmin
      .from('business_categories')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase
    const transformedCategories = categories?.map(c => ({
      id: c.id,
      storeId: c.store_id,
      name: c.name,
      description: c.description,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    })) || [];

    return NextResponse.json(transformedCategories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('cat');
    }

    if (!data.name || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const categoryData = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      description: data.description
    };

    const { data: created, error } = await supabaseAdmin
      .from('business_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      description: created.description,
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

    const { data: updated, error } = await supabaseAdmin
      .from('business_categories')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

    // Transformar respuesta
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      description: updated.description,
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
      .from('business_categories')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
