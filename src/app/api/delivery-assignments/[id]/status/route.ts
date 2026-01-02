import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status es requerido' }, { status: 400 });
    }

    const validStatuses = ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: `status debe ser uno de: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    const updateData: any = {
      delivery_status: status,
      updated_at: new Date().toISOString()
    };

    // Agregar timestamps según el status
    if (status === 'picked_up') {
      updateData.pickup_time = new Date().toISOString();
    }
    if (status === 'in_transit') {
      updateData.pickup_time = updateData.pickup_time || new Date().toISOString();
    }
    if (status === 'delivered') {
      updateData.delivery_time = new Date().toISOString();
      updateData.completed_at = new Date().toISOString();
    }
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar estado en la orden
    await supabaseAdmin
      .from('orders')
      .update({
        delivery_status: status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'cancelled' : 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', data.order_id);

    return NextResponse.json({
      id: data.id,
      orderId: data.order_id,
      storeId: data.store_id,
      deliveryProviderId: data.delivery_provider_id,
      orderCustomerName: data.order_customer_name,
      orderCustomerPhone: data.order_customer_phone,
      orderTotal: data.order_total,
      deliveryStatus: data.delivery_status,
      pickupTime: data.pickup_time,
      deliveryTime: data.delivery_time,
      assignedAt: data.assigned_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error updating delivery status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
