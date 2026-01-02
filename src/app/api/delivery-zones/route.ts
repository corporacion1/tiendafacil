import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('delivery_zones')
      .select('*')
      .eq('store_id', storeId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('priority', { ascending: true });

    if (error) throw error;

    const zones = data?.map((z: any) => ({
      id: z.id,
      name: z.name,
      description: z.description,
      storeId: z.store_id,
      centerLatitude: z.center_latitude,
      centerLongitude: z.center_longitude,
      radiusKm: z.radius_km,
      baseFee: z.base_fee,
      perKmFee: z.per_km_fee,
      perKmFeeOutsideZone: z.per_km_fee_outside_zone,
      estimatedMinutesPerKm: z.estimated_minutes_per_km,
      priority: z.priority,
      status: z.status,
      createdAt: z.created_at,
      updatedAt: z.updated_at,
    })) || [];

    return NextResponse.json(zones);
  } catch (error: any) {
    console.error('❌ Error fetching delivery zones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId, name, description,
      centerLatitude, centerLongitude, radiusKm,
      baseFee, perKmFee, perKmFeeOutsideZone,
      estimatedMinutesPerKm, priority, status
    } = body;

    if (!storeId || !name || !centerLatitude || !centerLongitude || !radiusKm || !baseFee) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, name, centerLatitude, centerLongitude, radiusKm, baseFee'
      }, { status: 400 });
    }

    const id = `ZONE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('delivery_zones')
      .insert([{
        id,
        store_id: storeId,
        name,
        description,
        center_latitude: centerLatitude,
        center_longitude: centerLongitude,
        radius_km: radiusKm,
        base_fee: baseFee,
        per_km_fee: perKmFee || 0,
        per_km_fee_outside_zone: perKmFeeOutsideZone || 0,
        estimated_minutes_per_km: estimatedMinutesPerKm || 5,
        priority: priority || 1,
        status: status || 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      description: data.description,
      storeId: data.store_id,
      centerLatitude: data.center_latitude,
      centerLongitude: data.center_longitude,
      radiusKm: data.radius_km,
      baseFee: data.base_fee,
      perKmFee: data.per_km_fee,
      perKmFeeOutsideZone: data.per_km_fee_outside_zone,
      estimatedMinutesPerKm: data.estimated_minutes_per_km,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error creating delivery zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
