import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { data, error } = await supabaseAdmin
      .from('delivery_fee_rules')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Regla de tarifa no encontrada' }, { status: 404 });
      }
      throw error;
    }

    const rule = {
      id: data.id,
      name: data.name,
      description: data.description,
      storeId: data.store_id,
      feeType: data.fee_type,
      fixedFeeAmount: data.fixed_fee_amount,
      distanceBaseFee: data.distance_base_fee,
      distanceThresholdKm: data.distance_threshold_km,
      perKmFee: data.per_km_fee,
      maxDistanceKm: data.max_distance_km,
      zoneId: data.zone_id,
      minimumOrderAmount: data.minimum_order_amount,
      freeDeliveryThreshold: data.free_delivery_threshold,
      applyToProviderType: data.apply_to_provider_type,
      isPeakHours: data.is_peak_hours,
      peakHoursStart: data.peak_hours_start,
      peakHoursEnd: data.peak_hours_end,
      peakHoursMultiplier: data.peak_hours_multiplier,
      applicableDays: data.applicable_days,
      status: data.status,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('❌ Error fetching delivery fee rule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.feeType !== undefined) updateData.fee_type = body.feeType;
    if (body.fixedFeeAmount !== undefined) updateData.fixed_fee_amount = body.fixedFeeAmount;
    if (body.distanceBaseFee !== undefined) updateData.distance_base_fee = body.distanceBaseFee;
    if (body.distanceThresholdKm !== undefined) updateData.distance_threshold_km = body.distanceThresholdKm;
    if (body.perKmFee !== undefined) updateData.per_km_fee = body.perKmFee;
    if (body.maxDistanceKm !== undefined) updateData.max_distance_km = body.maxDistanceKm;
    if (body.zoneId !== undefined) updateData.zone_id = body.zoneId;
    if (body.minimumOrderAmount !== undefined) updateData.minimum_order_amount = body.minimumOrderAmount;
    if (body.freeDeliveryThreshold !== undefined) updateData.free_delivery_threshold = body.freeDeliveryThreshold;
    if (body.applyToProviderType !== undefined) updateData.apply_to_provider_type = body.applyToProviderType;
    if (body.isPeakHours !== undefined) updateData.is_peak_hours = body.isPeakHours;
    if (body.peakHoursStart !== undefined) updateData.peak_hours_start = body.peakHoursStart;
    if (body.peakHoursEnd !== undefined) updateData.peak_hours_end = body.peakHoursEnd;
    if (body.peakHoursMultiplier !== undefined) updateData.peak_hours_multiplier = body.peakHoursMultiplier;
    if (body.applicableDays !== undefined) updateData.applicable_days = body.applicableDays;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabaseAdmin
      .from('delivery_fee_rules')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      description: data.description,
      storeId: data.store_id,
      feeType: data.fee_type,
      fixedFeeAmount: data.fixed_fee_amount,
      distanceBaseFee: data.distance_base_fee,
      distanceThresholdKm: data.distance_threshold_km,
      perKmFee: data.per_km_fee,
      maxDistanceKm: data.max_distance_km,
      zoneId: data.zone_id,
      minimumOrderAmount: data.minimum_order_amount,
      freeDeliveryThreshold: data.free_delivery_threshold,
      applyToProviderType: data.apply_to_provider_type,
      isPeakHours: data.is_peak_hours,
      peakHoursStart: data.peak_hours_start,
      peakHoursEnd: data.peak_hours_end,
      peakHoursMultiplier: data.peak_hours_multiplier,
      applicableDays: data.applicable_days,
      status: data.status,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error updating delivery fee rule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { error } = await supabaseAdmin
      .from('delivery_fee_rules')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Regla de tarifa eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error deleting delivery fee rule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
