import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const deliveryProviderId = searchParams.get('deliveryProviderId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('delivery_assignments')
      .select('*')
      .eq('store_id', storeId);

    if (status) {
      query = query.eq('delivery_status', status);
    }

    if (deliveryProviderId) {
      query = query.eq('delivery_provider_id', deliveryProviderId);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) throw error;

    const assignments = data?.map((a: any) => ({
      id: a.id,
      orderId: a.order_id,
      storeId: a.store_id,
      deliveryProviderId: a.delivery_provider_id,
      orderCustomerName: a.order_customer_name,
      orderCustomerPhone: a.order_customer_phone,
      orderCustomerEmail: a.order_customer_email,
      orderCustomerAddress: a.order_customer_address,
      orderTotal: a.order_total,
      orderItems: a.order_items,
      deliveryFee: a.delivery_fee,
      deliveryFeeRuleId: a.delivery_fee_rule_id,
      deliveryZoneId: a.delivery_zone_id,
      distanceKm: a.distance_km,
      providerCommissionAmount: a.provider_commission_amount,
      providerPaymentStatus: a.provider_payment_status,
      providerPaymentDate: a.provider_payment_date,
      providerPaymentMethod: a.provider_payment_method,
      providerPaymentReference: a.provider_payment_reference,
      storeLatitude: a.store_latitude,
      storeLongitude: a.store_longitude,
      destinationLatitude: a.destination_latitude,
      destinationLongitude: a.destination_longitude,
      pickupLatitude: a.pickup_latitude,
      pickupLongitude: a.pickup_longitude,
      currentLatitude: a.current_latitude,
      currentLongitude: a.current_longitude,
      estimatedDurationMinutes: a.estimated_duration_minutes,
      actualDurationMinutes: a.actual_duration_minutes,
      deliveryStatus: a.delivery_status,
      pickupTime: a.pickup_time,
      deliveryTime: a.delivery_time,
      deliveryNotes: a.delivery_notes,
      proofOfDeliveryUrl: a.proof_of_delivery_url,
      customerRating: a.customer_rating,
      customerFeedback: a.customer_feedback,
      whatsappNotificationSent: a.whatsapp_notification_sent,
      whatsappNotificationTime: a.whatsapp_notification_time,
      assignedAt: a.assigned_at,
      assignedBy: a.assigned_by,
      completedAt: a.completed_at,
      cancelledAt: a.cancelled_at,
      cancellationReason: a.cancellation_reason,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })) || [];

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('❌ Error fetching delivery assignments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId, storeId, deliveryProviderId,
      customerName, customerPhone, customerEmail, customerAddress,
      orderTotal, orderItems,
      destinationLat, destinationLon,
      storeLat, storeLon,
      deliveryFee, deliveryFeeRuleId, deliveryZoneId, distanceKm,
      providerCommissionAmount,
      deliveryNotes,
      assignedBy
    } = body;

    if (!orderId || !storeId || !deliveryProviderId || !customerName) {
      return NextResponse.json({
        error: 'Campos requeridos: orderId, storeId, deliveryProviderId, customerName'
      }, { status: 400 });
    }

    const id = `DA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .insert([{
        id,
        order_id: orderId,
        store_id: storeId,
        delivery_provider_id: deliveryProviderId,
        order_customer_name: customerName,
        order_customer_phone: customerPhone,
        order_customer_email: customerEmail,
        order_customer_address: customerAddress,
        order_total: orderTotal || 0,
        order_items: orderItems,
        delivery_fee: deliveryFee || 0,
        delivery_fee_rule_id: deliveryFeeRuleId,
        delivery_zone_id: deliveryZoneId,
        distance_km: distanceKm,
        provider_commission_amount: providerCommissionAmount || 0,
        store_latitude: storeLat,
        store_longitude: storeLon,
        destination_latitude: destinationLat,
        destination_longitude: destinationLon,
        delivery_status: 'pending',
        delivery_notes: deliveryNotes,
        assigned_by: assignedBy,
        estimated_duration_minutes: distanceKm ? Math.ceil(distanceKm * 5) : null
      }])
      .select()
      .single();

    if (error) throw error;

    // Actualizar la orden con los datos de delivery
    await supabaseAdmin
      .from('orders')
      .update({
        delivery_provider_id: deliveryProviderId,
        delivery_fee: deliveryFee || 0,
        delivery_status: 'pending',
        delivery_method: 'delivery',
        latitude: destinationLat || null,
        longitude: destinationLon || null,
        customer_address: customerAddress || null,
        delivery_notes: deliveryNotes || null
      })
      .eq('order_id', orderId);

    return NextResponse.json({
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
      deliveryStatus: data.delivery_status,
      storeLatitude: data.store_latitude,
      storeLongitude: data.store_longitude,
      destinationLatitude: data.destination_latitude,
      destinationLongitude: data.destination_longitude,
      estimatedDurationMinutes: data.estimated_duration_minutes,
      assignedAt: data.assigned_at,
      assignedBy: data.assigned_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error creating delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
