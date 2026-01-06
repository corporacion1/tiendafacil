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
    console.log('🔄 [CANCEL] Cancelando asignación (trimmed ID):', id);

    // Paso 1: Resetear montos explícitamente antes de cancelar
    // Intentamos buscar por ID o por order_id para asegurar que lo encontramos
    console.log('🔄 [CANCEL] Paso 1: Reseteando montos a 0 (buscando por id OR order_id)...');
    const { data: step1Data, error: resetError } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_fee: 0,
        provider_commission_amount: 0,
        delivery_zone_id: null,
        delivery_fee_rule_id: null
      })
      .or(`id.eq.${id},order_id.eq.${id}`)
      .select()
      .maybeSingle();

    if (resetError) {
      console.error('❌ [CANCEL] Error en paso 1 (reset montos):', resetError);
    } else if (!step1Data) {
      console.warn('⚠️ [CANCEL] Paso 1: No se encontró la asignación (o update no hizo cambios) para ID:', id);
    } else {
      console.log('✅ [CANCEL] Paso 1 completado. Fees reseteados:', {
        fee: step1Data.delivery_fee,
        commission: step1Data.provider_commission_amount
      });
    }

    // Paso 2: Actualizar estado
    console.log('🔄 [CANCEL] Paso 2: Cambiando estado a cancelled...');
    const updatePayload = {
      delivery_status: 'cancelled',
      cancellation_reason: cancellationReason || '',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 [CANCEL] Payload de actualización:', JSON.stringify(updatePayload, null, 2));

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updatePayload)
      .or(`id.eq.${id},order_id.eq.${id}`)
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
