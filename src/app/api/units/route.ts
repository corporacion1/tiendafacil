import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/units - Obtener unidades por storeId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    console.log(' [Units API] GET units for store:', storeId);

    const { data: units, error } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });

    if (error) {
      console.error(' [Units API] Error fetching units:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const transformedUnits = (units || []).map((u: any) => ({
      id: u.id,
      storeId: u.store_id,
      name: u.name,
      abbreviation: u.abbreviation,
      createdAt: u.created_at
    }));

    console.log(` [Units API] Returned ${transformedUnits.length} units`);
    return NextResponse.json(transformedUnits);
  } catch (error: any) {
    console.error(' [Units API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/units - Crear nueva unidad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    console.log(' [Units API] POST unit:', body.name);

    const unitData = {
      id: IDGenerator.generate('unit'),
      store_id: body.storeId,
      name: body.name,
      abbreviation: body.abbreviation || null
    };

    const { data: created, error } = await supabaseAdmin
      .from('units')
      .insert(unitData)
      .select()
      .single();

    if (error) {
      console.error(' [Units API] Error creating unit:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Units API] Unit created:', created.id);

    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      abbreviation: created.abbreviation,
      createdAt: created.created_at
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error(' [Units API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/units - Actualizar unidad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log(' [Units API] PUT unit:', id);

    const dbUpdateData: any = {};
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.abbreviation !== undefined) dbUpdateData.abbreviation = updateData.abbreviation;

    const { data: updated, error } = await supabaseAdmin
      .from('units')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' [Units API] Error updating unit:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Units API] Unit updated:', updated.id);

    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      abbreviation: updated.abbreviation,
      createdAt: updated.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(' [Units API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/units - Eliminar unidad
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log(' [Units API] DELETE unit:', id);

    const { data, error } = await supabaseAdmin
      .from('units')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' [Units API] Error deleting unit:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(' [Units API] Unit deleted:', id);
    return NextResponse.json({ message: 'Unidad eliminada exitosamente' });
  } catch (error: any) {
    console.error(' [Units API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}