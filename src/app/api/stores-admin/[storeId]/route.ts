import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const resolvedParams = await params;
    const storeId = resolvedParams.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) throw error;
    if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    // Transformar snake_case a camelCase
    const transformedStore = {
      storeId: store.id,
      name: store.name,
      businessType: store.business_type,
      address: store.address,
      phone: store.phone,
      email: store.email,
      logoUrl: store.logo_url,
      status: store.status,
      primaryCurrencyName: store.primary_currency,
      primaryCurrencySymbol: store.primary_currency_symbol,
      secondaryCurrencyName: store.secondary_currency,
      secondaryCurrencySymbol: store.secondary_currency_symbol,
      tax1: store.tax1,
      tax2: store.tax2,
      nitId: store.nitId,
      colorPalette: store.color_palette,
      createdAt: store.created_at,
      updatedAt: store.updated_at
    };

    return NextResponse.json(transformedStore);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const resolvedParams = await params;
    const storeId = resolvedParams.storeId;
    const data = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Mapear campos a actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status) updateData.status = data.status;
    if (data.subscriptionPlan) updateData.subscription_plan = data.subscriptionPlan;

    const { data: updated, error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    // Transformar respuesta
    const response = {
      storeId: updated.id,
      name: updated.name,
      businessType: updated.business_type,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      logoUrl: updated.logo_url,
      status: updated.status,
      primaryCurrencyName: updated.primary_currency,
      primaryCurrencySymbol: updated.primary_currency_symbol,
      secondaryCurrencyName: updated.secondary_currency,
      secondaryCurrencySymbol: updated.secondary_currency_symbol,
      tax1: updated.tax1,
      tax2: updated.tax2,
      nitId: updated.nitId,
      colorPalette: updated.color_palette,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}