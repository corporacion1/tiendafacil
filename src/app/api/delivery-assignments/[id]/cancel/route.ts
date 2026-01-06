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

    console.log('🔄 [CANCEL] Cancelando asignación:', resolvedParams.id);

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_status: 'cancelled',
        cancellation_reason: cancellationReason || '',
        cancelled_at: new Date().toISOString(),
        delivery_fee: 0,
        provider_commission_amount: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [CANCEL] Error actualizando asignación:', updateError);
      throw updateError;
    }

    console.log('✅ [CANCEL] Asignación actualizada:', updateData);

    if (updateData && updateData.order_id) {
      console.log('🔄 [CANCEL] Cancelando orden asociada:', updateData.order_id);
      // Actualizar orden a 'cancelled' y resetear delivery_fee
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
          delivery_status: 'cancelled',
          delivery_fee: 0,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', updateData.order_id);

      if (orderError) {
        console.error('❌ [CANCEL] Error actualizando orden:', orderError);
      } else {
        console.log('✅ [CANCEL] Orden actualizada correctamente');
      }
    }

    return NextResponse.json({
      id: updateData.id,
      orderId: updateData.order_id,
      deliveryStatus: updateData.delivery_status,
      cancellationReason: updateData.cancellation_reason,
      cancelledAt: updateData.cancelled_at,
      updatedAt: updateData.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error cancelling delivery:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
