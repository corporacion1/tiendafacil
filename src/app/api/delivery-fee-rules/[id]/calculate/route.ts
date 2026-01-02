import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      destinationLat,
      destinationLon,
      storeLat,
      storeLon,
      orderAmount,
      providerType
    } = body;

    if (!storeId || !destinationLat || !destinationLon || !storeLat || !storeLon) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, destinationLat, destinationLon, storeLat, storeLon'
      }, { status: 400 });
    }

    // Llamar a la función SQL de cálculo de tarifa
    const { data, error } = await supabaseAdmin.rpc('calculate_delivery_fee', {
      store_id_param: storeId,
      destination_lat: destinationLat,
      destination_lon: destinationLon,
      store_lat: storeLat,
      store_lon: storeLon,
      order_amount: orderAmount || 0,
      provider_type_param: providerType || 'all'
    });

    if (error) throw error;

    // Calcular minutos estimados
    const distanceKm = data?.[0]?.distance_km || 0;
    const estimatedMinutes = Math.ceil(distanceKm * 5);

    return NextResponse.json({
      fee: data?.[0]?.fee || 0,
      distanceKm: distanceKm,
      ruleId: data?.[0]?.rule_id,
      zoneId: data?.[0]?.zone_id,
      estimatedMinutes
    });
  } catch (error: any) {
    console.error('❌ Error calculating delivery fee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
