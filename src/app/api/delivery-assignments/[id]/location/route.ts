import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { currentLatitude, currentLongitude } = body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (currentLatitude !== undefined) {
      updateData.current_latitude = currentLatitude;
    }
    if (currentLongitude !== undefined) {
      updateData.current_longitude = currentLongitude;
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      orderId: data.order_id,
      currentLatitude: data.current_latitude,
      currentLongitude: data.current_longitude,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error updating delivery location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
