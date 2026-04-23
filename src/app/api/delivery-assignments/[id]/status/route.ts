import { NextResponse, NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('🔄 [PATCH /delivery-assignments/status] ID:', resolvedParams.id);
    
    const body = await request.json();
    const { status } = body;
    
    console.log('📤 Status a actualizar:', status);

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

    const { data, error } = await dbAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('❌ Error en DB update:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ No se encontró la asignación:', resolvedParams.id);
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    console.log('✅ Asignación actualizada:', data.id);

    await dbAdmin
      .from('orders')
      .update({
        delivery_status: status,  // Mantener el mismo status que delivery_assignments
        updated_at: new Date().toISOString()
      })
      .eq('order_id', data.order_id);

    // Calcular actual_duration_minutes si es picked_up o delivered
    if ((status === 'picked_up' || status === 'delivered') && data.assigned_at) {
      const assignedAt = new Date(data.assigned_at);
      const now = new Date();
      const durationMinutes = Math.round((now.getTime() - assignedAt.getTime()) / 60000);
      
      await dbAdmin
        .from('delivery_assignments')
        .update({ actual_duration_minutes: durationMinutes })
        .eq('id', resolvedParams.id);
    }

    // Recargar los datos actualizados
    const { data: updatedData } = await dbAdmin
      .from('delivery_assignments')
      .select('*')
      .eq('id', resolvedParams.id)
      .maybeSingle();

    return NextResponse.json({
      id: updatedData?.id || data.id,
      orderId: updatedData?.order_id || data.order_id,
      storeId: updatedData?.store_id || data.store_id,
      deliveryProviderId: updatedData?.delivery_provider_id || data.delivery_provider_id,
      orderCustomerName: updatedData?.order_customer_name || data.order_customer_name,
      orderCustomerPhone: updatedData?.order_customer_phone || data.order_customer_phone,
      orderTotal: updatedData?.order_total || data.order_total,
      deliveryStatus: updatedData?.delivery_status || data.delivery_status,
      pickupTime: updatedData?.pickup_time || data.pickup_time,
      deliveryTime: updatedData?.delivery_time || data.delivery_time,
      actualDurationMinutes: updatedData?.actual_duration_minutes || data.actual_duration_minutes,
      assignedAt: updatedData?.assigned_at || data.assigned_at,
      updatedAt: updatedData?.updated_at || data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error updating delivery status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
