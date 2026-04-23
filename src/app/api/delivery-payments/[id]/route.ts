import { NextResponse, NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { error } = await dbAdmin
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
