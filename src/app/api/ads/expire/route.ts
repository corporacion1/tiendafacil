import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/ads/expire - Forzar inactivación de anuncios vencidos (para testing/admin)
export async function POST() {
  try {
    const now = new Date().toISOString();
    console.log('🔄 [Ads API] Checking for expired ads:', now);

    // Buscar anuncios vencidos que aún estén activos
    const { data: expiredAds, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('*')
      .lt('expiry_date', now)
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ [Ads API] Error fetching expired ads:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredAds || expiredAds.length === 0) {
      return NextResponse.json({
        message: 'No hay anuncios vencidos para inactivar',
        expiredCount: 0
      });
    }

    // Inactivar anuncios vencidos
    const { error: updateError } = await supabaseAdmin
      .from('ads')
      .update({ status: 'inactive' })
      .lt('expiry_date', now)
      .eq('status', 'active');

    if (updateError) {
      console.error('❌ [Ads API] Error updating expired ads:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ [Ads API] ${expiredAds.length} anuncios vencidos marcados como inactivos`);

    return NextResponse.json({
      message: `${expiredAds.length} anuncios vencidos han sido inactivados`,
      expiredCount: expiredAds.length,
      expiredAds: expiredAds.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        expiryDate: ad.expiry_date
      }))
    });
  } catch (error: any) {
    console.error('❌ [Ads API] Unexpected error in expire:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}