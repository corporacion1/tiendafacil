import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId y status son requeridos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        delivery_status: status,
        processed_at: status === 'processing' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Pedido ${orderId} actualizado a status: ${status}`
    });
  } catch (error: any) {
    console.error('❌ Error updating order delivery status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
