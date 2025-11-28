import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('⚠️ [Purchases API] Error fetching purchases (tabla podría no existir):', error.message);
      // Retornar array vacío en lugar de error 500
      return NextResponse.json([]);
    }

    // Transformar snake_case a camelCase
    const transformedPurchases = purchases?.map((p: any) => ({
      id: p.id,
      storeId: p.store_id,
      supplierId: p.supplier_id,
      supplierName: p.supplier_name,
      date: p.date,
      total: p.total,
      status: p.status,
      items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items,
      notes: p.notes,
      userId: p.user_id,
      createdAt: p.created_at
    })) || [];

    return NextResponse.json(transformedPurchases);
  } catch (error: any) {
    console.error('❌ [Purchases API] Error inesperado:', error);
    // Retornar array vacío en lugar de error 500
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('purchase');
    }

    if (!data.storeId || !data.supplierId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const purchaseData = {
      id: data.id,
      store_id: data.storeId,
      supplier_id: data.supplierId,
      supplier_name: data.supplierName,
      date: data.date || new Date().toISOString(),
      total: data.total || 0,
      status: data.status || 'completed',
      items: JSON.stringify(data.items || []),
      notes: data.notes,
      user_id: data.userId || 'system'
    };

    const { data: created, error } = await supabaseAdmin
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      id: created.id,
      storeId: created.store_id,
      supplierId: created.supplier_id,
      supplierName: created.supplier_name,
      date: created.date,
      total: created.total,
      status: created.status,
      items: typeof created.items === 'string' ? JSON.parse(created.items) : created.items,
      notes: created.notes,
      userId: created.user_id,
      createdAt: created.created_at
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
    const updateData: any = {};
    if (data.supplierId) updateData.supplier_id = data.supplierId;
    if (data.supplierName) updateData.supplier_name = data.supplierName;
    if (data.date) updateData.date = data.date;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.status) updateData.status = data.status;
    if (data.items) updateData.items = JSON.stringify(data.items);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: updated, error } = await supabaseAdmin
      .from('purchases')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });

    // Transformar respuesta
    const response = {
      id: updated.id,
      storeId: updated.store_id,
      supplierId: updated.supplier_id,
      supplierName: updated.supplier_name,
      date: updated.date,
      total: updated.total,
      status: updated.status,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items) : updated.items,
      notes: updated.notes,
      userId: updated.user_id,
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
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ message: "Compra eliminada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
