import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

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
    console.log('🔄 [PUT /delivery-assignments/:id] ID:', resolvedParams.id);

    const body = await request.json();
    console.log('📥 Body recibido:', JSON.stringify(body, null, 2));

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
      deliveryFee,
      estimatedDurationMinutes
    } = body;

    console.log('📦 Datos para actualizar:', {
      orderCustomerName,
      orderCustomerPhone,
      orderCustomerAddress,
      deliveryNotes,
      storeLatitude,
      storeLongitude,
      deliveryProviderId,
      deliveryZoneId,
      distanceKm,
      deliveryFee,
      estimatedDurationMinutes
    });

    // Transformar camelCase a snake_case para Supabase
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (orderCustomerName !== undefined) updateData.order_customer_name = orderCustomerName;
    if (orderCustomerPhone !== undefined) updateData.order_customer_phone = orderCustomerPhone;
    if (orderCustomerAddress !== undefined) updateData.order_customer_address = orderCustomerAddress;
    if (deliveryNotes !== undefined) updateData.delivery_notes = deliveryNotes;
    if (storeLatitude !== undefined) updateData.store_latitude = storeLatitude;
    if (storeLongitude !== undefined) updateData.store_longitude = storeLongitude;
    if (deliveryProviderId !== undefined) updateData.delivery_provider_id = deliveryProviderId;
    if (deliveryZoneId !== undefined) updateData.delivery_zone_id = deliveryZoneId;
    if (distanceKm !== undefined) updateData.distance_km = distanceKm;
    if (deliveryFee !== undefined) updateData.delivery_fee = deliveryFee;
    if (estimatedDurationMinutes !== undefined) updateData.estimated_duration_minutes = estimatedDurationMinutes;

    console.log('📦 Datos actualizados para Supabase:', JSON.stringify(updateData, null, 2));

    // Primero verificar si la asignación existe
    console.log('🔍 Buscando asignación con ID:', resolvedParams.id);
    
    const { data: existingAssignment, error: fetchError } = await supabaseAdmin
      .from('delivery_assignments')
      .select('id')
      .eq('id', resolvedParams.id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error buscando asignación:', fetchError);
      throw fetchError;
    }

    if (!existingAssignment) {
      console.error('❌ Asignación NO encontrada en la base de datos');
      console.error('❌ ID buscado:', resolvedParams.id);
      
      // Verificar si hay asignaciones en la tabla
      const { data: allAssignments, error: countError } = await supabaseAdmin
        .from('delivery_assignments')
        .select('id', { count: 'exact', head: true })
        .limit(5);
      
      console.log('❌ Total asignaciones (muestra):', allAssignments);
      
      console.log('❌ Preparando respuesta 404...');
      
      const errorResponse = {
        error: 'No se encontró la asignación para actualizar',
        id: resolvedParams.id,
        searchedId: resolvedParams.id,
        timestamp: new Date().toISOString()
      };
      
      console.log('❌ Respuesta de error:', JSON.stringify(errorResponse));
      
      return NextResponse.json(errorResponse, { status: 404 });
    }

    console.log('✅ Asignación encontrada:', existingAssignment);

    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error('❌ Error en update:', updateError);
      console.error('Error message:', updateError.message);
      console.error('Error code:', updateError.code);
      console.error('Error details:', updateError.details);
      console.error('Error hint:', updateError.hint);
      
      return NextResponse.json({
        error: updateError.message || 'Error al actualizar la asignación',
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      }, { status: 400 });
    }

    console.log('✅ Assignment actualizado:', updatedAssignment);

    // Actualizar la orden SOLO con columnas existentes
    if (updatedAssignment.order_id) {
      console.log('🔄 Actualizando order:', updatedAssignment.order_id);

      const orderUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      // Sincronizar delivery_status con delivery_assignments
      if (updatedAssignment.delivery_status !== undefined) {
        orderUpdateData.delivery_status = updatedAssignment.delivery_status;
      }

      if (deliveryProviderId !== undefined) orderUpdateData.delivery_provider_id = deliveryProviderId;
      if (deliveryFee !== undefined) orderUpdateData.delivery_fee = deliveryFee;
      if (deliveryProviderId !== undefined) orderUpdateData.delivery_method = 'delivery';
      if (updatedAssignment.destination_latitude !== undefined) orderUpdateData.latitude = updatedAssignment.destination_latitude;
      if (updatedAssignment.destination_longitude !== undefined) orderUpdateData.longitude = updatedAssignment.destination_longitude;
      if (orderCustomerAddress !== undefined) orderUpdateData.customer_address = orderCustomerAddress;
      if (deliveryNotes !== undefined) orderUpdateData.delivery_notes = deliveryNotes;

      console.log('📦 Datos para actualizar en orders:', JSON.stringify(orderUpdateData, null, 2));

      await supabaseAdmin
        .from('orders')
        .update(orderUpdateData)
        .eq('order_id', updatedAssignment.order_id);

      console.log('✅ Order actualizado');

      // Invalidar cache de orders
      revalidateTag('orders');
    }

    // Transformar snake_case a camelCase para respuesta
    const response = {
      id: updatedAssignment.id,
      orderId: updatedAssignment.order_id,
      storeId: updatedAssignment.store_id,
      deliveryProviderId: updatedAssignment.delivery_provider_id,
      orderCustomerName: updatedAssignment.order_customer_name,
      orderCustomerPhone: updatedAssignment.order_customer_phone,
      orderCustomerEmail: updatedAssignment.order_customer_email,
      orderCustomerAddress: updatedAssignment.order_customer_address,
      orderTotal: updatedAssignment.order_total,
      orderItems: updatedAssignment.order_items,
      deliveryFee: updatedAssignment.delivery_fee,
      deliveryFeeRuleId: updatedAssignment.delivery_fee_rule_id,
      deliveryZoneId: updatedAssignment.delivery_zone_id,
      distanceKm: updatedAssignment.distance_km,
      providerCommissionAmount: updatedAssignment.provider_commission_amount,
      providerPaymentStatus: updatedAssignment.provider_payment_status,
      storeLatitude: updatedAssignment.store_latitude,
      storeLongitude: updatedAssignment.store_longitude,
      destinationLatitude: updatedAssignment.destination_latitude,
      destinationLongitude: updatedAssignment.destination_longitude,
      estimatedDurationMinutes: updatedAssignment.estimated_duration_minutes,
      deliveryStatus: updatedAssignment.delivery_status,
      deliveryNotes: updatedAssignment.delivery_notes,
      assignedAt: updatedAssignment.assigned_at,
      assignedBy: updatedAssignment.assigned_by,
      updatedAt: updatedAssignment.updated_at,
    };

    console.log('✅ Response:', JSON.stringify(response, null, 2));

    // Invalidar cache de delivery-assignments
    revalidateTag('delivery-assignments');

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error updating delivery assignment:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
