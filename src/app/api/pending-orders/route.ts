import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    // Solo obtener órdenes con estado 'pending'
    const { data: pendingOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase
    const transformedOrders = pendingOrders?.map((o: any) => ({
      orderId: o.order_id,
      storeId: o.store_id,
      items: o.items,
      status: o.status,
      total: o.total,
      customer: o.customer,
      createdAt: o.created_at,
      updatedAt: o.updated_at
    })) || [];

    return NextResponse.json(transformedOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.orderId || !data.storeId || !data.items) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Mapear a snake_case
    const orderData = {
      order_id: data.orderId,
      store_id: data.storeId,
      items: data.items,
      status: 'pending',
      total: data.total || 0,
      customer: data.customer
    };

    const { data: created, error } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      orderId: created.order_id,
      storeId: created.store_id,
      items: created.items,
      status: created.status,
      total: created.total,
      customer: created.customer,
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
    if (!data.orderId || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'orderId' y 'storeId'" }, { status: 400 });
    }

    // Mapear campos a actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.status) updateData.status = data.status;
    if (data.items) updateData.items = data.items;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.customer) updateData.customer = data.customer;

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('order_id', data.orderId)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Transformar respuesta
    const response = {
      orderId: updated.order_id,
      storeId: updated.store_id,
      items: updated.items,
      status: updated.status,
      total: updated.total,
      customer: updated.customer,
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
    const orderId = searchParams.get('orderId');
    const storeId = searchParams.get('storeId');

    if (!orderId || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'orderId' y/o 'storeId'" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('order_id', orderId)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ message: "Orden eliminada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
