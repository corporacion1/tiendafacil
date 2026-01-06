import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { cancellationReason } = body;

    const id = resolvedParams.id.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    console.log(`🔄 [CANCEL] ID: ${id}, Es UUID: ${isUuid}`);

    // Paso 1: Resetear montos
    console.log('🔄 [CANCEL] Paso 1: Reseteando montos a 0...');
    let step1Query = supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_fee: 0,
        provider_commission_amount: 0,
        delivery_zone_id: null,
        delivery_fee_rule_id: null
      });

    if (isUuid) {
      step1Query = step1Query.eq('id', id);
    } else {
      step1Query = step1Query.eq('order_id', id);
    }

    const { data: step1Data, error: resetError } = await step1Query.select().maybeSingle();

    if (resetError) {
      console.error('❌ [CANCEL] Error en paso 1:', resetError);
    } else if (!step1Data) {
      console.warn('⚠️ [CANCEL] Paso 1: No se encontró asignación para resetear montos.');
    } else {
      console.log('✅ [CANCEL] Paso 1 completado.');
    }

    // Paso 2: Actualizar estado
    console.log('🔄 [CANCEL] Paso 2: Cambiando estado a cancelled...');
    const updatePayload = {
      delivery_status: 'cancelled',
      cancellation_reason: cancellationReason || '',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let step2Query = supabaseAdmin
      .from('delivery_assignments')
      .update(updatePayload);

    if (isUuid) {
      step2Query = step2Query.eq('id', id);
    } else {
      step2Query = step2Query.eq('order_id', id);
    }

    const { data: updateData, error: updateError } = await step2Query.select().single();

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
