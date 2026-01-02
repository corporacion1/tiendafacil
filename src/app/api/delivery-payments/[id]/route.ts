import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { error } = await supabaseAdmin
      .from('delivery_payments')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Pago eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error deleting delivery payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
