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
      .from('delivery_fee_rules')
      .select('*')
      .eq('store_id', storeId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('priority', { ascending: false });

    if (error) throw error;

    const rules = data?.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      storeId: r.store_id,
      feeType: r.fee_type,
      fixedFeeAmount: r.fixed_fee_amount,
      distanceBaseFee: r.distance_base_fee,
      distanceThresholdKm: r.distance_threshold_km,
      perKmFee: r.per_km_fee,
      maxDistanceKm: r.max_distance_km,
      zoneId: r.zone_id,
      minimumOrderAmount: r.minimum_order_amount,
      freeDeliveryThreshold: r.free_delivery_threshold,
      applyToProviderType: r.apply_to_provider_type,
      isPeakHours: r.is_peak_hours,
      peakHoursStart: r.peak_hours_start,
      peakHoursEnd: r.peak_hours_end,
      peakHoursMultiplier: r.peak_hours_multiplier,
      applicableDays: r.applicable_days,
      status: r.status,
      priority: r.priority,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) || [];

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('❌ Error fetching delivery fee rules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId, name, description, feeType,
      fixedFeeAmount, distanceBaseFee, distanceThresholdKm,
      perKmFee, maxDistanceKm, zoneId,
      minimumOrderAmount, freeDeliveryThreshold,
      applyToProviderType, isPeakHours,
      peakHoursStart, peakHoursEnd, peakHoursMultiplier,
      applicableDays, priority, status
    } = body;

    if (!storeId || !name || !feeType) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, name, feeType'
      }, { status: 400 });
    }

    const id = `FEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('delivery_fee_rules')
      .insert([{
        id,
        store_id: storeId,
        name,
        description,
        fee_type: feeType,
        fixed_fee_amount: fixedFeeAmount,
        distance_base_fee: distanceBaseFee,
        distance_threshold_km: distanceThresholdKm,
        per_km_fee: perKmFee,
        max_distance_km: maxDistanceKm,
        zone_id: zoneId,
        minimum_order_amount: minimumOrderAmount,
        free_delivery_threshold: freeDeliveryThreshold,
        apply_to_provider_type: applyToProviderType,
        is_peak_hours: isPeakHours || false,
        peak_hours_start: peakHoursStart,
        peak_hours_end: peakHoursEnd,
        peak_hours_multiplier: peakHoursMultiplier || 1.5,
        applicable_days: applicableDays,
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
    console.error('❌ Error creating delivery fee rule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
