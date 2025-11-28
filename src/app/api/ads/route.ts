import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/ads - Obtener anuncios filtrados por tipo de negocio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType');
    const storeId = searchParams.get('storeId');

    console.log('📢 [Ads API] GET ads:', { businessType, storeId });

    let query = supabaseAdmin
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrar por businessType si se proporciona
    if (businessType) {
      query = query.eq('status', 'active');
    }

    // Filtrar por storeId si se proporciona
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: ads, error } = await query;

    if (error) {
      console.error('❌ [Ads API] Error fetching ads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrar por businessType en JS si es necesario (para targetBusinessTypes array)
    let filteredAds = ads;
    if (businessType && ads) {
      filteredAds = ads.filter((ad: any) => {
        if (!ad.target_business_types || !Array.isArray(ad.target_business_types)) {
          return true;
        }
        return ad.target_business_types.includes(businessType);
      });
    }

    // Transformar snake_case a camelCase
    const transformedAds = (filteredAds || []).map((ad: any) => ({
      id: ad.id,
      storeId: ad.store_id,
      name: ad.name,
      description: ad.description,
      imageUrl: ad.image_url,
      imageHint: ad.image_hint,
      linkUrl: ad.link_url,
      status: ad.status,
      views: ad.views || 0,
      targetBusinessTypes: ad.target_business_types || [],
      expiryDate: ad.expiry_date,
      createdAt: ad.created_at
    }));

    console.log(`✅ [Ads API] Returned ${transformedAds.length} ads`);
    return NextResponse.json(transformedAds);
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ads - Crear un nuevo anuncio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.targetBusinessTypes || body.targetBusinessTypes.length === 0) {
      return NextResponse.json({ error: 'targetBusinessTypes es requerido' }, { status: 400 });
    }

    console.log('📢 [Ads API] POST ad:', body.name);

    const adData = {
      id: IDGenerator.generate('ad'),
      store_id: body.storeId || null,
      name: body.name,
      description: body.description || null,
      image_url: body.imageUrl || null,
      image_hint: body.imageHint || null,
      link_url: body.linkUrl || null,
      status: body.status || 'active',
      views: 0,
      target_business_types: body.targetBusinessTypes,
      expiry_date: body.expiryDate || null
    };

    const { data: created, error } = await supabaseAdmin
      .from('ads')
      .insert(adData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Ads API] Error creating ad:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Ads API] Ad created:', created.id);

    const response = {
      id: created.id,
      storeId: created.store_id,
      name: created.name,
      description: created.description,
      imageUrl: created.image_url,
      imageHint: created.image_hint,
      linkUrl: created.link_url,
      status: created.status,
      views: created.views,
      targetBusinessTypes: created.target_business_types,
      expiryDate: created.expiry_date,
      createdAt: created.created_at
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/ads - Actualizar un anuncio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log('📢 [Ads API] PUT ad:', id);

    // Transformar camelCase a snake_case
    const dbUpdateData: any = {};
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.imageUrl !== undefined) dbUpdateData.image_url = updateData.imageUrl;
    if (updateData.imageHint !== undefined) dbUpdateData.image_hint = updateData.imageHint;
    if (updateData.linkUrl !== undefined) dbUpdateData.link_url = updateData.linkUrl;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
    if (updateData.targetBusinessTypes !== undefined) dbUpdateData.target_business_types = updateData.targetBusinessTypes;
    if (updateData.expiryDate !== undefined) dbUpdateData.expiry_date = updateData.expiryDate;

    const { data: updated, error } = await supabaseAdmin
      .from('ads')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Ads API] Error updating ad:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Ads API] Ad updated:', updated.id);

    const response = {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      description: updated.description,
      imageUrl: updated.image_url,
      imageHint: updated.image_hint,
      linkUrl: updated.link_url,
      status: updated.status,
      views: updated.views,
      targetBusinessTypes: updated.target_business_types,
      expiryDate: updated.expiry_date,
      createdAt: updated.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/ads - Eliminar un anuncio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    console.log('🗑️ [Ads API] DELETE ad:', id);

    const { data, error } = await supabaseAdmin
      .from('ads')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Ads API] Error deleting ad:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Ads API] Ad deleted:', id);
    return NextResponse.json({ message: 'Anuncio eliminado exitosamente' });
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
