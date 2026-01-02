import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('delivery_providers')
      .select('*')
      .eq('store_id', storeId);

    if (status) {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('provider_type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const providers = data?.map((p: any) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      address: p.address,
      providerType: p.provider_type,
      externalServiceName: p.external_service_name,
      externalProviderId: p.external_provider_id,
      vehicleType: p.vehicle_type,
      vehiclePlate: p.vehicle_plate,
      commissionType: p.commission_type,
      commissionFixedAmount: p.commission_fixed_amount,
      commissionPercentage: p.commission_percentage,
      paymentMethod: p.payment_method,
      bankAccountInfo: p.bank_account_info,
      status: p.status,
      photoUrl: p.photo_url,
      storeId: p.store_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p.created_by,
      notes: p.notes,
    })) || [];

    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('❌ Error fetching delivery providers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId, name, phone, email, address,
      providerType, externalServiceName, externalProviderId,
      vehicleType, vehiclePlate,
      commissionType, commissionFixedAmount, commissionPercentage,
      paymentMethod, bankAccountInfo,
      status, photoUrl, notes
    } = body;

    if (!storeId || !name || !phone) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, name, phone'
      }, { status: 400 });
    }

    const id = `PROV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('delivery_providers')
      .insert([{
        id,
        store_id: storeId,
        name,
        phone,
        email,
        address,
        provider_type: providerType || 'internal',
        external_service_name: externalServiceName,
        external_provider_id: externalProviderId,
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate,
        commission_type: commissionType || 'fixed',
        commission_fixed_amount: commissionFixedAmount || 0,
        commission_percentage: commissionPercentage || 0,
        payment_method: paymentMethod,
        bank_account_info: bankAccountInfo,
        status: status || 'active',
        photo_url: photoUrl,
        notes
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      providerType: data.provider_type,
      externalServiceName: data.external_service_name,
      externalProviderId: data.external_provider_id,
      vehicleType: data.vehicle_type,
      vehiclePlate: data.vehicle_plate,
      commissionType: data.commission_type,
      commissionFixedAmount: data.commission_fixed_amount,
      commissionPercentage: data.commission_percentage,
      paymentMethod: data.payment_method,
      bankAccountInfo: data.bank_account_info,
      status: data.status,
      photoUrl: data.photo_url,
      storeId: data.store_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      notes: data.notes,
    });
  } catch (error: any) {
    console.error('❌ Error creating delivery provider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
