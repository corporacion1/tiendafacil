import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    // Buscar órdenes con status='processed' y deliveryMethod='delivery'
    // que no tengan asignación en delivery_assignments
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('order_id, customer_name, customer_phone, customer_email, customer_address, items, total, delivery_method, delivery_status, delivery_fee, delivery_fee, created_at, updated_at, latitude, longitude')
      .eq('store_id', storeId)
      .eq('status', 'processed')
      .eq('delivery_method', 'delivery');

    if (ordersError) throw ordersError;

    const orderIds = orders?.map(o => o.order_id) || [];

    // Buscar órdenes que ya tienen asignación
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('delivery_assignments')
      .select('order_id')
      .in('order_id', orderIds);

    if (assignmentsError) throw assignmentsError;

    const assignedOrderIds = assignments?.map(a => a.order_id) || [];

    // Filtrar órdenes pendientes
    const pendingOrders = orders?.filter(order => !assignedOrderIds.includes(order.order_id)).map(order => ({
      orderId: order.order_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      customerAddress: order.customer_address,
      items: order.items,
      total: order.total,
      deliveryFee: order.delivery_fee || 0,
      deliveryStatus: order.delivery_status || 'pending',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      latitude: order.latitude,
      longitude: order.longitude,
    })) || [];

    return NextResponse.json(pendingOrders);
  } catch (error: any) {
    console.error('❌ Error fetching pending deliveries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
