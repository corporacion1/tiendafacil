import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .select('*')
      .eq('store_id', storeId)
      .in('delivery_status', ['pending', 'picked_up', 'in_transit'])
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    const assignments = data?.map((a: any) => ({
      id: a.id,
      orderId: a.order_id,
      storeId: a.store_id,
      deliveryProviderId: a.delivery_provider_id,
      orderCustomerName: a.order_customer_name,
      orderCustomerPhone: a.order_customer_phone,
      orderTotal: a.order_total,
      deliveryFee: a.delivery_fee,
      distanceKm: a.distance_km,
      estimatedDurationMinutes: a.estimated_duration_minutes,
      actualDurationMinutes: a.actual_duration_minutes,
      deliveryStatus: a.delivery_status,
      pickupTime: a.pickup_time,
      deliveryTime: a.delivery_time,
      assignedAt: a.assigned_at,
      updatedAt: a.updated_at,
    })) || [];

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('❌ Error fetching active deliveries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
