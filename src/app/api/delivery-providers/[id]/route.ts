import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data, error } = await supabaseAdmin
      .from('delivery_providers')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
      }
      throw error;
    }

    const provider = {
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
      createdBy: data.created_by,
      notes: data.notes,
    };

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('❌ Error fetching delivery provider:', error);
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

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.providerType !== undefined) updateData.provider_type = body.providerType;
    if (body.externalServiceName !== undefined) updateData.external_service_name = body.externalServiceName;
    if (body.externalProviderId !== undefined) updateData.external_provider_id = body.externalProviderId;
    if (body.vehicleType !== undefined) updateData.vehicle_type = body.vehicleType;
    if (body.vehiclePlate !== undefined) updateData.vehicle_plate = body.vehiclePlate;
    if (body.commissionType !== undefined) updateData.commission_type = body.commissionType;
    if (body.commissionFixedAmount !== undefined) updateData.commission_fixed_amount = body.commissionFixedAmount;
    if (body.commissionPercentage !== undefined) updateData.commission_percentage = body.commissionPercentage;
    if (body.paymentMethod !== undefined) updateData.payment_method = body.paymentMethod;
    if (body.bankAccountInfo !== undefined) updateData.bank_account_info = body.bankAccountInfo;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.photoUrl !== undefined) updateData.photo_url = body.photoUrl;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabaseAdmin
      .from('delivery_providers')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    const provider = {
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
      createdBy: data.created_by,
      notes: data.notes,
    };

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('❌ Error updating delivery provider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { error } = await supabaseAdmin
      .from('delivery_providers')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error deleting delivery provider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
