import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
      }
      throw error;
    }

    const assignment = {
      id: data.id,
      orderId: data.order_id,
      storeId: data.store_id,
      deliveryProviderId: data.delivery_provider_id,
      orderCustomerName: data.order_customer_name,
      orderCustomerPhone: data.order_customer_phone,
      orderCustomerEmail: data.order_customer_email,
      orderCustomerAddress: data.order_customer_address,
      orderTotal: data.order_total,
      orderItems: data.order_items,
      deliveryFee: data.delivery_fee,
      deliveryFeeRuleId: data.delivery_fee_rule_id,
      deliveryZoneId: data.delivery_zone_id,
      distanceKm: data.distance_km,
      providerCommissionAmount: data.provider_commission_amount,
      providerPaymentStatus: data.provider_payment_status,
      providerPaymentDate: data.provider_payment_date,
      providerPaymentMethod: data.provider_payment_method,
      providerPaymentReference: data.provider_payment_reference,
      storeLatitude: data.store_latitude,
      storeLongitude: data.store_longitude,
      destinationLatitude: data.destination_latitude,
      destinationLongitude: data.destination_longitude,
      pickupLatitude: data.pickup_latitude,
      pickupLongitude: data.pickup_longitude,
      currentLatitude: data.current_latitude,
      currentLongitude: data.current_longitude,
      estimatedDurationMinutes: data.estimated_duration_minutes,
      actualDurationMinutes: data.actual_duration_minutes,
      deliveryStatus: data.delivery_status,
      pickupTime: data.pickup_time,
      deliveryTime: data.delivery_time,
      deliveryNotes: data.delivery_notes,
      proofOfDeliveryUrl: data.proof_of_delivery_url,
      customerRating: data.customer_rating,
      customerFeedback: data.customer_feedback,
      whatsappNotificationSent: data.whatsapp_notification_sent,
      whatsappNotificationTime: data.whatsapp_notification_time,
      assignedAt: data.assigned_at,
      assignedBy: data.assigned_by,
      completedAt: data.completed_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error('❌ Error fetching delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { error } = await supabaseAdmin
      .from('delivery_assignments')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error deleting delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const {
      orderCustomerName,
      orderCustomerPhone,
      orderCustomerAddress,
      deliveryNotes,
      storeLatitude,
      storeLongitude,
      deliveryProviderId,
      deliveryZoneId,
      distanceKm,
      deliveryFee
    } = body;

    // Actualizar la asignación
    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        order_customer_name: orderCustomerName,
        order_customer_phone: orderCustomerPhone,
        order_customer_address: orderCustomerAddress,
        delivery_notes: deliveryNotes,
        store_latitude: storeLatitude,
        store_longitude: storeLongitude,
        delivery_provider_id: deliveryProviderId,
        delivery_zone_id: deliveryZoneId,
        distance_km: distanceKm,
        delivery_fee: deliveryFee,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    // Obtener el order_id para actualizar la tabla orders
    const assignmentData = await supabaseAdmin
      .from('delivery_assignments')
      .select('order_id')
      .eq('id', resolvedParams.id)
      .single();

    if (assignmentData.data?.order_id) {
      // Actualizar la tabla orders con los datos de delivery
      await supabaseAdmin
        .from('orders')
        .update({
          delivery_provider_id: deliveryProviderId,
          delivery_fee: deliveryFee || 0,
          delivery_status: 'pending',
          delivery_method: 'delivery',
          latitude: data.destination_latitude || null,
          longitude: data.destination_longitude || null,
          customer_address: orderCustomerAddress || null,
          delivery_notes: deliveryNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', assignmentData.data.order_id);
    }

    return NextResponse.json({
      id: data.id,
      orderId: data.order_id,
      storeId: data.store_id,
      deliveryProviderId: data.delivery_provider_id,
      orderCustomerName: data.order_customer_name,
      orderCustomerPhone: data.order_customer_phone,
      orderCustomerAddress: data.order_customer_address,
      deliveryFee: data.delivery_fee,
      deliveryZoneId: data.delivery_zone_id,
      distanceKm: data.distance_km,
      deliveryStatus: data.delivery_status,
      storeLatitude: data.store_latitude,
      storeLongitude: data.store_longitude,
      destinationLatitude: data.destination_latitude,
      destinationLongitude: data.destination_longitude,
      deliveryNotes: data.delivery_notes,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error updating delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
