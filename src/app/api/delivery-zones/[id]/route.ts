import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateDistanceKm } from '@/lib/delivery-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const pointLat = parseFloat(searchParams.get('lat') || '0');
    const pointLon = parseFloat(searchParams.get('lon') || '0');

    const { data: zone, error } = await supabaseAdmin
      .from('delivery_zones')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 });
      }
      throw error;
    }

    const result = {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      storeId: zone.store_id,
      centerLatitude: zone.center_latitude,
      centerLongitude: zone.center_longitude,
      radiusKm: zone.radius_km,
      baseFee: zone.base_fee,
      perKmFee: zone.per_km_fee,
      perKmFeeOutsideZone: zone.per_km_fee_outside_zone,
      estimatedMinutesPerKm: zone.estimated_minutes_per_km,
      priority: zone.priority,
      status: zone.status,
      createdAt: zone.created_at,
      updatedAt: zone.updated_at,
    };

    if (pointLat && pointLon) {
      const distance = calculateDistanceKm(
        pointLat,
        pointLon,
        zone.center_latitude,
        zone.center_longitude
      );
      (result as any).distanceKm = distance;
      (result as any).isInZone = distance <= zone.radius_km;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error fetching delivery zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
