import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';
import { revalidateTag } from 'next/cache';

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
    console.log('📥 [POST /delivery-assignments] Recibiendo solicitud');
    const body = await request.json();
    console.log('📥 Body recibido:', JSON.stringify(body, null, 2));
    console.log('📥 Request URL:', request.url);
    console.log('📥 Request method:', request.method);

    // Validar que el body sea un objeto válido
    if (!body || typeof body !== 'object') {
      console.error('❌ Body inválido:', typeof body);
      return NextResponse.json({
        error: 'Body de la solicitud inválido'
      }, { status: 400 });
    }

    // Generar ID único si no se proporciona
    const id = body.id || body.assignmentId || IDGenerator.generate('assignment');
    console.log('📦 ID generado/proporcionado:', id);

    // Validar campos requeridos
    const { orderId, storeId, deliveryProviderId, customerName } = body;
    const missingFields = [];
    if (!orderId) missingFields.push('orderId');
    if (!storeId) missingFields.push('storeId');
    if (!deliveryProviderId) missingFields.push('deliveryProviderId');
    if (!customerName) missingFields.push('customerName');

    if (missingFields.length > 0) {
      console.error('❌ Campos faltantes:', { orderId, storeId, deliveryProviderId, customerName });
      return NextResponse.json({
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 });
    }

    // Validar tipos de datos
    if (typeof orderId !== 'string') {
      return NextResponse.json({
        error: 'orderId debe ser un string'
      }, { status: 400 });
    }

    if (typeof storeId !== 'string') {
      return NextResponse.json({
        error: 'storeId debe ser un string'
      }, { status: 400 });
    }

    if (typeof deliveryProviderId !== 'string') {
      return NextResponse.json({
        error: 'deliveryProviderId debe ser un string'
      }, { status: 400 });
    }

    if (typeof customerName !== 'string' || customerName.trim() === '') {
      return NextResponse.json({
        error: 'customerName debe ser un string no vacío'
      }, { status: 400 });
    }

    console.log('📤 Creando delivery_assignment');

    // Transformar camelCase a snake_case para Supabase
    const assignmentData = {
      id: id,
      order_id: orderId,
      store_id: storeId,
      delivery_provider_id: deliveryProviderId,
      order_customer_name: customerName,
      order_customer_phone: body.customerPhone || null,
      order_customer_email: body.customerEmail || null,
      order_customer_address: body.customerAddress || null,
      order_total: body.orderTotal || 0,
      order_items: body.orderItems || null,
      destination_latitude: body.destinationLat || null,
      destination_longitude: body.destinationLon || null,
      store_latitude: body.storeLat || null,
      store_longitude: body.storeLon || null,
      delivery_fee: body.deliveryFee || 0,
      delivery_fee_rule_id: body.deliveryFeeRuleId || null,
      delivery_zone_id: body.deliveryZoneId || null,
      distance_km: body.distanceKm || null,
      delivery_status: body.deliveryStatus || 'pending',  // Usar el valor del body o 'pending' por defecto
      delivery_notes: body.deliveryNotes || null,
      assigned_by: body.assignedBy || null,
      estimated_duration_minutes: body.estimatedDurationMinutes !== undefined ? body.estimatedDurationMinutes : (body.distanceKm ? Math.ceil(body.distanceKm * 5) : null),
      provider_commission_amount: body.providerCommissionAmount || 0,
      provider_payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📦 Datos para insertar en delivery_assignments:', JSON.stringify(assignmentData, null, 2));
    console.log('📦 Longitud de datos:', JSON.stringify(assignmentData).length, 'bytes');

    console.log('🔄 Ejecutando INSERT en Supabase...');
    const startTime = Date.now();

    const { data: createdAssignment, error: insertError } = await supabaseAdmin
      .from('delivery_assignments')
      .insert([assignmentData])
      .select()
      .maybeSingle();

    const duration = Date.now() - startTime;
    console.log(`📊 Tiempo de ejecución del INSERT: ${duration}ms`);

    if (insertError) {
      console.error('❌ Error insertando delivery_assignment:', insertError);
      console.error('❌ Error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });

      return NextResponse.json({
        error: insertError.message || 'Error al crear la asignación de delivery',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 400 });
    }

    if (!createdAssignment) {
      console.error('❌ No se creó la asignación - response vacío');
      return NextResponse.json({
        error: 'No se pudo crear la asignación de delivery - respuesta vacía'
      }, { status: 500 });
    }

    console.log('✅ Delivery assignment creado:', createdAssignment);
    console.log('✅ Assignment ID:', createdAssignment.id);

    if (insertError) {
      console.error('❌ Error insertando delivery_assignment:', insertError);
      console.error('❌ Error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });

      return NextResponse.json({
        error: insertError.message || 'Error al crear la asignación de delivery',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 400 });
    }

    if (!createdAssignment) {
      console.error('❌ No se creó la asignación - response vacío');
      return NextResponse.json({
        error: 'No se pudo crear la asignación de delivery - respuesta vacía'
      }, { status: 500 });
    }

    console.log('✅ Delivery assignment creado:', createdAssignment);

    // Actualizar la orden con los datos de delivery SOLO columnas existentes
    if (createdAssignment) {
      console.log('🔄 Actualizando order:', orderId);

      const orderUpdateData: any = {
        updated_at: new Date().toISOString(),
        delivery_status: body.deliveryStatus || 'pending'  // Sincronizar con delivery_assignments
      };

      if (body.deliveryProviderId !== undefined) orderUpdateData.delivery_provider_id = deliveryProviderId;
      if (body.deliveryFee !== undefined) orderUpdateData.delivery_fee = body.deliveryFee;
      if (body.deliveryMethod !== undefined) orderUpdateData.delivery_method = body.deliveryMethod;
      if (body.destinationLat !== undefined) orderUpdateData.latitude = body.destinationLat;
      if (body.destinationLon !== undefined) orderUpdateData.longitude = body.destinationLon;
      if (body.customerAddress !== undefined) orderUpdateData.customer_address = body.customerAddress;
      if (body.deliveryNotes !== undefined) orderUpdateData.delivery_notes = body.deliveryNotes;

      console.log('📦 Datos para actualizar en orders:', JSON.stringify(orderUpdateData, null, 2));

      await supabaseAdmin
        .from('orders')
        .update(orderUpdateData)
        .eq('order_id', orderId);

      console.log('✅ Order actualizado');
    }

    // Transformar snake_case a camelCase para respuesta
    const response = {
      id: createdAssignment.id,
      orderId: createdAssignment.order_id,
      storeId: createdAssignment.store_id,
      deliveryProviderId: createdAssignment.delivery_provider_id,
      orderCustomerName: createdAssignment.order_customer_name,
      orderCustomerPhone: createdAssignment.order_customer_phone,
      orderCustomerEmail: createdAssignment.order_customer_email,
      orderCustomerAddress: createdAssignment.order_customer_address,
      orderTotal: createdAssignment.order_total,
      orderItems: createdAssignment.order_items,
      deliveryFee: createdAssignment.delivery_fee,
      deliveryFeeRuleId: createdAssignment.delivery_fee_rule_id,
      deliveryZoneId: createdAssignment.delivery_zone_id,
      distanceKm: createdAssignment.distance_km,
      providerCommissionAmount: createdAssignment.provider_commission_amount,
      providerPaymentStatus: createdAssignment.provider_payment_status,
      storeLatitude: createdAssignment.store_latitude,
      storeLongitude: createdAssignment.store_longitude,
      destinationLatitude: createdAssignment.destination_latitude,
      destinationLongitude: createdAssignment.destination_longitude,
      estimatedDurationMinutes: createdAssignment.estimated_duration_minutes,
      deliveryStatus: createdAssignment.delivery_status,
      deliveryNotes: createdAssignment.delivery_notes,
      assignedAt: createdAssignment.created_at,
      assignedBy: createdAssignment.assigned_by,
      createdAt: createdAssignment.created_at,
      updatedAt: createdAssignment.updated_at,
    };

    console.log('✅ Response:', JSON.stringify(response, null, 2));

    // Invalidar cache
    revalidateTag(`delivery-assignments-${storeId}`);
    revalidateTag('delivery-assignments');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ [POST /delivery-assignments] Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
