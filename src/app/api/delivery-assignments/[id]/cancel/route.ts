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

    // NOTA: El ID puede ser un formato personalizado (EJ: ASS-...) o UUID.
    // La columna 'id' en DB parece ser TEXT, por lo que podemos buscar cualquier string sin error de tipo.

    console.log(`🔄 [CANCEL] Buscando asignación para input: ${id}`);

    let foundAssignment = null;

    // Intento 1: Buscar por ID (PK) SIEMPRE.
    // Asumimos que la columna 'id' es texto y acepta cualquier valor.
    const { data: dataById, error: errorById } = await supabaseAdmin
      .from('delivery_assignments')
      .select('id, delivery_status')
      .eq('id', id)
      .maybeSingle();

    if (!errorById && dataById) {
      foundAssignment = dataById;
      console.log('✅ Encontrado por ID directo');
    } else if (errorById) {
      // Si errorById es 'invalid input syntax for type uuid', significa que la columna SI es uuid. 
      // Pero si insertamos ASS-..., entonces es TEXT. Ignoramos error y seguimos.
      console.warn('⚠️ Error buscando por ID directo (posible mismatch de tipo, ignorando):', errorById.message);
    }

    // Intento 2: Buscar por order_id si no se encontró por ID
    if (!foundAssignment) {
      console.log('🔄 No encontrado por ID, buscando por order_id...');
      const { data: dataByOrder, error: errorByOrder } = await supabaseAdmin
        .from('delivery_assignments')
        .select('id, delivery_status')
        .eq('order_id', id)
        .maybeSingle();

      if (!errorByOrder && dataByOrder) {
        foundAssignment = dataByOrder;
        console.log('✅ Encontrado por order_id');
      } else if (errorByOrder) {
        console.warn('⚠️ Error buscando por order_id:', errorByOrder.message);
      }
    }

    if (!foundAssignment) {
      console.warn(`⚠️ Asignación no encontrada en DB para: ${id}`);
      return NextResponse.json({
        error: `Asignación no encontrada. Input: ${id}`
      }, { status: 404 });
    }

    const realId = foundAssignment.id;
    console.log(`✅ Asignación confirmada. ID Real: ${realId}`);

    // Paso 1: Resetear montos usando el ID Real
    const { error: resetError } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_fee: 0,
        provider_commission_amount: 0,
        delivery_zone_id: null,
        delivery_fee_rule_id: null
      })
      .eq('id', realId);

    if (resetError) {
      console.error('❌ Error resetting amounts:', resetError);
    }

    // Paso 2: Actualizar estado usando el ID Real
    const updatePayload = {
      delivery_status: 'cancelled',
      cancellation_reason: cancellationReason || '',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updatePayload)
      .eq('id', realId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating assignment status:', updateError);
      throw updateError;
    }

    if (!updateData) {
      return NextResponse.json({ error: 'Error post-update: Datos no retornados' }, { status: 500 });
    }

    if (updateData && updateData.order_id) {
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
        console.error('❌ Error updating order status:', orderError);
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
