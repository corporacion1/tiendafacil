import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { cancellationReason } = body;

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_status: 'cancelled',
        cancellation_reason: cancellationReason || '',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar orden a 'cancelled'
    await supabaseAdmin
      .from('orders')
      .update({
        delivery_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', data.order_id);

    return NextResponse.json({
      id: data.id,
      orderId: data.order_id,
      deliveryStatus: data.delivery_status,
      cancellationReason: data.cancellation_reason,
      cancelledAt: data.cancelled_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error cancelling delivery:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
