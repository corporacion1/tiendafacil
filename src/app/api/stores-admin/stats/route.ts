import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all stores
    const { data: allStores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('*');

    if (storesError) throw storesError;

    const stores = allStores || [];

    // Calculate statistics
    const total = stores.length;
    const active = stores.filter((s: any) => s.status === 'active').length;
    const inactive = stores.filter((s: any) => s.status === 'inactive').length;
    // Count stores in production mode
    const production = stores.filter((s: any) => s.status === 'inProduction').length;

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get recent activity (stores created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStores = stores
      .filter((s: any) => s.created_at && new Date(s.created_at) >= thirtyDaysAgo)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Get admin info for recent stores
    const recentActivity = await Promise.all(
      recentStores.map(async (store: any) => {
        let adminName = 'Desconocido';

        // Try to get owner info
        if (store.owner_ids && Array.isArray(store.owner_ids) && store.owner_ids.length > 0) {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('display_name, email')
            .eq('uid', store.owner_ids[0])
            .single();

          if (userData) {
            adminName = userData.display_name || userData.email || 'Desconocido';
          }
        }

        return {
          storeId: store.id,
          storeName: store.name || 'Sin nombre',
          adminName,
          createdAt: store.created_at,
          status: store.status === 'inProduction' ? 'production' : (store.status || 'active'),
          isProduction: store.status === 'inProduction'
        };
      })
    );

    return NextResponse.json({
      total,
      active,
      inactive,
      production,
      totalUsers: totalUsers || 0,
      recentActivity,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching store stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}