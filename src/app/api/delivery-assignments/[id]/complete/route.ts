import { NextResponse, NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('🔄 [POST /delivery-assignments/complete] ID:', resolvedParams.id);
    
    const body = await request.json();
    const { customerRating, customerFeedback, proofOfDeliveryUrl, actualDurationMinutes } = body;

    if (customerRating && (customerRating < 1 || customerRating > 5)) {
      return NextResponse.json({ error: 'customerRating debe ser entre 1 y 5' }, { status: 400 });
    }

    const updateData: any = {
      delivery_status: 'delivered',
      delivery_time: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (customerRating !== undefined) {
      updateData.customer_rating = customerRating;
    }
    if (customerFeedback !== undefined) {
      updateData.customer_feedback = customerFeedback;
    }
    if (proofOfDeliveryUrl !== undefined) {
      updateData.proof_of_delivery_url = proofOfDeliveryUrl;
    }
    if (actualDurationMinutes !== undefined) {
      updateData.actual_duration_minutes = actualDurationMinutes;
    }

    console.log('📤 Datos a actualizar:', JSON.stringify(updateData, null, 2));

    const { data, error } = await dbAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('❌ Error en DB:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ No se encontró la asignación:', resolvedParams.id);
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    console.log('✅ Asignación encontrada:', data.id, 'order_id:', data.order_id);

    // Actualizar orden a 'delivered'
    console.log('🔄 Actualizando order:', data.order_id);
    
    const { error: orderError } = await dbAdmin
      .from('orders')
      .update({
        delivery_status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', data.order_id);

    if (orderError) {
      console.error('❌ Error actualizando order:', orderError);
      // No lanzamos error para no fallar todo el proceso
    } else {
      console.log('✅ Order actualizado');
    }

    return NextResponse.json({
      id: data.id,
      orderId: data.order_id,
      deliveryStatus: data.delivery_status,
      deliveryTime: data.delivery_time,
      customerRating: data.customer_rating,
      customerFeedback: data.customer_feedback,
      actualDurationMinutes: data.actual_duration_minutes,
      completedAt: data.completed_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error completing delivery:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
