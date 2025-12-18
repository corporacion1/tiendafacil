import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/families - Obtener familias por storeId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    console.log(' [Families API] GET families for store:', storeId);

    const { data: families, error } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });

    if (error) {
      console.error(' [Families API] Error fetching families:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const transformedFamilies = (families || []).map((f: any) => ({
      id: f.id,
      storeId: f.store_id,
      name: f.name,
      description: f.description,
      createdAt: f.created_at
    }));

    console.log(` [Families API] Returned ${transformedFamilies.length} families`);
    return NextResponse.json(transformedFamilies);
  } catch (error: any) {
    console.error(' [Families API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/families - Crear nueva familia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    console.log(' [Families API] POST family:', body.name);

    const familyData = {
      id: IDGenerator.generate('family'),
      store_id: body.storeId,
      name: body.name,
      description: body.description || null
    };

    const { data: created, error } = await supabaseAdmin
      .from('families')
      .insert(familyData)
      .select()
      .single();

    if (error) {
      console.error(' [Families API] Error creating family:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Families API] Family created:', created.id);

    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      description: created.description,
      createdAt: created.created_at
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error(' [Families API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/families - Actualizar familia
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log(' [Families API] PUT family:', id);

    const dbUpdateData: any = {};
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;

    const { data: updated, error } = await supabaseAdmin
      .from('families')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' [Families API] Error updating family:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Families API] Family updated:', updated.id);

    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      description: updated.description,
      createdAt: updated.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(' [Families API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/families - Eliminar familia
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log(' [Families API] DELETE family:', id);

    const { data, error } = await supabaseAdmin
      .from('families')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' [Families API] Error deleting family:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Families API] Family deleted:', id);
    
    return NextResponse.json({ message: 'Familia eliminada exitosamente' });
  } catch (error: any) {
    console.error(' [Families API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}