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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    const { data: zone, error } = await supabaseAdmin
      .from('delivery_zones')
      .select('id')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !zone) {
      return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('delivery_zones')
      .delete()
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('❌ Error deleting delivery zone:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: resolvedParams.id });
  } catch (error: any) {
    console.error('❌ Error deleting delivery zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    // Transformar nombres de camelCase a snake_case para Supabase
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.centerLatitude !== undefined) updates.center_latitude = body.centerLatitude;
    if (body.centerLongitude !== undefined) updates.center_longitude = body.centerLongitude;
    if (body.radiusKm !== undefined) updates.radius_km = body.radiusKm;
    if (body.baseFee !== undefined) updates.base_fee = body.baseFee;
    if (body.perKmFee !== undefined) updates.per_km_fee = body.perKmFee;
    if (body.perKmFeeOutsideZone !== undefined) updates.per_km_fee_outside_zone = body.perKmFeeOutsideZone;
    if (body.estimatedMinutesPerKm !== undefined) updates.estimated_minutes_per_km = body.estimatedMinutesPerKm;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;

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

    const { data: updatedZone, error: updateError } = await supabaseAdmin
      .from('delivery_zones')
      .update(updates)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating delivery zone:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const result = {
      id: updatedZone.id,
      name: updatedZone.name,
      description: updatedZone.description,
      storeId: updatedZone.store_id,
      centerLatitude: updatedZone.center_latitude,
      centerLongitude: updatedZone.center_longitude,
      radiusKm: updatedZone.radius_km,
      baseFee: updatedZone.base_fee,
      perKmFee: updatedZone.per_km_fee,
      perKmFeeOutsideZone: updatedZone.per_km_fee_outside_zone,
      estimatedMinutesPerKm: updatedZone.estimated_minutes_per_km,
      priority: updatedZone.priority,
      status: updatedZone.status,
      createdAt: updatedZone.created_at,
      updatedAt: updatedZone.updated_at,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error updating delivery zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
