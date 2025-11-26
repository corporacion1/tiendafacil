import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/ads/[id]/views - Incrementar vistas de un anuncio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    console.log('👁️ [Ads API] Incrementing views for ad:', id);

    // Primero obtener el valor actual de views
    const { data: ad, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('views')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('❌ [Ads API] Error fetching ad:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Incrementar views
    const newViews = (ad.views || 0) + 1;
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('ads')
      .update({ views: newViews })
      .eq('id', id)
      .select('views')
      .single();

    if (updateError) {
      console.error('❌ [Ads API] Error updating views:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ [Ads API] Views updated for ad ${id}: ${updated.views}`);
    return NextResponse.json({ views: updated.views });
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error in views:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}