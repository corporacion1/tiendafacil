import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar orden a 'delivered'
    await supabaseAdmin
      .from('orders')
      .update({
        delivery_status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', data.order_id);

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
