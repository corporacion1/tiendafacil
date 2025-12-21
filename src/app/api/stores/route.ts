import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Leer tienda actual
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // id de la tienda

    if (!id) {
      console.error('❌ [Stores API] ID de tienda requerido');
      return NextResponse.json({ error: 'ID de tienda requerido' }, { status: 400 });
    }

    console.log('🔍 [Stores API] Buscando tienda con ID:', id);

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !store) {
      console.error('❌ [Stores API] Tienda no encontrada:', id, error);
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    console.log('✅ [Stores API] Tienda encontrada:', store.name);
    console.log('🔑 [Stores API] Columnas disponibles:', Object.keys(store));

    // Transformar snake_case a camelCase
    const response = {
      id: store.id,
      storeId: store.id, // Alias for backwards compatibility
      name: store.name,
      businessType: store.business_type,
      address: store.address,
      phone: store.phone,
      email: store.email,
      taxId: store.tax_id,
      nitId: store.nitId || store.tax_id,
      logoUrl: store.logo_url,
      primaryCurrencyName: store.primary_currency,
      primaryCurrencySymbol: store.primary_currency_symbol,
      secondaryCurrencyName: store.secondary_currency,
      secondaryCurrencySymbol: store.secondary_currency_symbol,
      tax1: store.tax1,
      tax2: store.tax2,
      colorPalette: store.color_palette,
      status: store.status,
      createdAt: store.created_at,
      updatedAt: store.updated_at,
      whatsapp: store.whatsapp,
      meta: store.meta,
      tiktok: store.tiktok,
      saleSeries: store.saleSeries,
      saleCorrelative: store.saleCorrelative
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Stores API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Crear tienda
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('📥 [Stores API] Datos recibidos para crear tienda:', JSON.stringify(data, null, 2));

    // Ensure we use id consistently
    const storeId = data.storeId || data.id;

    if (!storeId || !data.name) {
      console.error('❌ [Stores API] Faltan campos obligatorios:', { storeId, name: data.name });
      return NextResponse.json({ error: "Faltan campos obligatorios (storeId, name)" }, { status: 400 });
    }

    // Verificar si ya existe una tienda con este id
    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (existingStore) {
      console.log('⚠️ [Stores API] Tienda ya existe, devolviendo existente:', storeId);

      const response = {
        id: existingStore.id,
        storeId: existingStore.id,
        name: existingStore.name,
        businessType: existingStore.business_type,
        address: existingStore.address,
        phone: existingStore.phone,
        email: existingStore.email,
        taxId: existingStore.tax_id,
        logoUrl: existingStore.logo_url,
        primaryCurrencyName: existingStore.primary_currency,
        primaryCurrencySymbol: existingStore.primary_currency_symbol,
        secondaryCurrencyName: existingStore.secondary_currency,
        secondaryCurrencySymbol: existingStore.secondary_currency_symbol,
        tax1: existingStore.tax1,
        tax2: existingStore.tax2,
        status: existingStore.status,
        createdAt: existingStore.created_at,
        updatedAt: existingStore.updated_at,
        whatsapp: existingStore.whatsapp,
        meta: existingStore.meta,
        tiktok: existingStore.tiktok
      };

      return NextResponse.json(response);
    }

    console.log('🏪 [Stores API] Creando nueva tienda:', storeId);

    // Transformar camelCase a snake_case
    const storeData = {
      id: storeId,
      name: data.name,
      business_type: data.businessType || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      tax_id: data.nitId || data.taxId || null,
      nitId: data.nitId || null,
      logo_url: data.logoUrl || null,
      primary_currency: data.primaryCurrencyName || data.primaryCurrency || 'USD',
      primary_currency_symbol: data.primaryCurrencySymbol || '$',
      secondary_currency: data.secondaryCurrencyName || data.secondaryCurrency || 'VES',
      secondary_currency_symbol: data.secondaryCurrencySymbol || 'Bs.',
      tax1: data.tax1 || 0,
      tax2: data.tax2 || 0,
      color_palette: data.colorPalette || 'blue-orange',
      status: data.status || 'active',
      whatsapp: data.whatsapp || null,
      meta: data.meta || null,
      tiktok: data.tiktok || null,
      saleSeries: data.saleSeries || null,
      saleCorrelative: data.saleCorrelative || 0
    };

    const { data: created, error } = await supabaseAdmin
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Stores API] Error creando tienda:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Stores API] Tienda creada exitosamente:', created.id);

    const response = {
      id: created.id,
      storeId: created.id,
      name: created.name,
      businessType: created.business_type,
      address: created.address,
      phone: created.phone,
      email: created.email,
      taxId: created.tax_id,
      nitId: created.nitId || created.tax_id,
      logoUrl: created.logo_url,
      primaryCurrencyName: created.primary_currency,
      primaryCurrencySymbol: created.primary_currency_symbol,
      secondaryCurrencyName: created.secondary_currency,
      secondaryCurrencySymbol: created.secondary_currency_symbol,
      tax1: created.tax1,
      tax2: created.tax2,
      status: created.status,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
      whatsapp: created.whatsapp,
      meta: created.meta,
      tiktok: created.tiktok,
      saleSeries: created.saleSeries,
      saleCorrelative: created.saleCorrelative
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Stores API] Error creando tienda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Editar tienda/settings
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Support both id and storeId for backwards compatibility
    const storeId = data.storeId || data.id;
    if (!storeId) {
      return NextResponse.json({ error: "Falta storeId de tienda" }, { status: 400 });
    }

    console.log('📝 [Stores API] Actualizando tienda:', storeId);
    console.log('🏷️ [Stores API] Nombre recibido:', data.name, 'Longitud:', data.name?.length);

    // Transformar camelCase a snake_case
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.businessType !== undefined) updateData.business_type = data.businessType;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.nitId !== undefined) updateData.nitId = data.nitId;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.saleSeries !== undefined) updateData.saleSeries = data.saleSeries;
    if (data.saleCorrelative !== undefined) updateData.saleCorrelative = data.saleCorrelative;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    if (data.primaryCurrencyName !== undefined) updateData.primary_currency = data.primaryCurrencyName;
    if (data.primaryCurrency !== undefined) updateData.primary_currency = data.primaryCurrency; // Backwards compatibility
    if (data.primaryCurrencySymbol !== undefined) updateData.primary_currency_symbol = data.primaryCurrencySymbol;
    if (data.secondaryCurrencyName !== undefined) updateData.secondary_currency = data.secondaryCurrencyName;
    if (data.secondaryCurrency !== undefined) updateData.secondary_currency = data.secondaryCurrency; // Backwards compatibility
    if (data.secondaryCurrencySymbol !== undefined) updateData.secondary_currency_symbol = data.secondaryCurrencySymbol;
    if (data.tax1 !== undefined) updateData.tax1 = data.tax1;
    if (data.tax2 !== undefined) updateData.tax2 = data.tax2;
    if (data.colorPalette !== undefined) updateData.color_palette = data.colorPalette;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.meta !== undefined) updateData.meta = data.meta;
    if (data.tiktok !== undefined) updateData.tiktok = data.tiktok;

    const { data: updated, error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Stores API] Error actualizando tienda:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Stores API] Tienda actualizada:', updated.name, 'Longitud final:', updated.name?.length);

    const response = {
      id: updated.id,
      storeId: updated.id,
      name: updated.name,
      businessType: updated.business_type,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      taxId: updated.tax_id,
      nitId: updated.nitId || updated.tax_id,
      logoUrl: updated.logo_url,
      primaryCurrencyName: updated.primary_currency,
      primaryCurrencySymbol: updated.primary_currency_symbol,
      secondaryCurrencyName: updated.secondary_currency,
      secondaryCurrencySymbol: updated.secondary_currency_symbol,
      colorPalette: updated.color_palette,
      status: updated.status,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      whatsapp: updated.whatsapp,
      meta: updated.meta,
      tiktok: updated.tiktok,
      saleSeries: updated.saleSeries,
      saleCorrelative: updated.saleCorrelative
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Stores API] Error actualizando tienda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Borrar tienda
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }

    console.log('🗑️ [Stores API] Eliminando tienda:', id);

    const { data: deleted, error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Stores API] Error eliminando tienda:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Tienda no existe" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Stores API] Tienda eliminada:', deleted.name);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Stores API] Error eliminando tienda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
