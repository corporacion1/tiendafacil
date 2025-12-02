import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { storeId, status } = data;

    if (!storeId || !status) {
      return NextResponse.json({ error: 'storeId y status son requeridos' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('stores')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}