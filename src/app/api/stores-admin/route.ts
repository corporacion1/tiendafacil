import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Si se proporciona storeId, devolver esa tienda específica
    if (storeId) {
      const { data: store, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

      // Get admin info (user with role 'admin' and matching store_id)
      let adminName = 'Sin administrador';
      let adminContact = '';
      
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('display_name, email, phone')
        .eq('store_id', storeId)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (userData) {
        adminName = userData.display_name || userData.email || 'Sin administrador';
        adminContact = userData.email || userData.phone || '';
      }

      // Get user count for this store (only admin users with matching store_id)
      const { count: userCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('role', 'admin');

      // Transformar snake_case a camelCase
      const transformedStore = {
        storeId: store.id,
        name: store.name,
        businessType: store.business_type,
        // description: store.description, // No existe en DB
        address: store.address,
        phone: store.phone,
        // email: store.email, // No existe en DB
        logoUrl: store.logo_url,
        status: store.status,
        // subscriptionPlan: store.subscription_plan, // No existe en DB
        createdAt: store.created_at,
        updatedAt: store.updated_at,
        // Campos adicionales para la administración
        adminName,
        adminContact,
        userCount: userCount || 0,
        isProduction: store.status === 'inProduction' || !store.use_demo_data,
        ownerIds: store.owner_ids || []
      };

      return NextResponse.json(transformedStore);
    }

    // Si no, devolver todas las tiendas (admin)
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase y agregar stats completas
    const transformedStores = await Promise.all(
      (stores || []).map(async (s: any) => {
        // Get admin info (user with role 'admin' and matching store_id)
        let adminName = 'Sin administrador';
        let adminContact = '';
        
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('display_name, email, phone')
          .eq('store_id', s.id)
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (userData) {
          adminName = userData.display_name || userData.email || 'Sin administrador';
          adminContact = userData.email || userData.phone || '';
        }

        // Get user count for this store (only admin users with matching store_id)
        const { count: userCount } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', s.id)
          .eq('role', 'admin');

        return {
          storeId: s.id,
          name: s.name,
          businessType: s.business_type,
          // description: s.description,
          address: s.address,
          phone: s.phone,
          // email: s.email,
          logoUrl: s.logo_url,
          status: s.status || 'active',
          // subscriptionPlan: s.subscription_plan || 'free',
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          // Campos adicionales para la administración
          adminName,
          adminContact,
          userCount: userCount || 0,
          isProduction: s.status === 'inProduction' || !s.use_demo_data,
          ownerIds: s.owner_ids || [],
          // Stats básicas (se pueden mejorar con queries adicionales)
          stats: {
            totalProducts: 0,
            totalSales: 0,
            totalRevenue: 0,
            activeUsers: 0
          }
        };
      })
    );

    // Retornar en formato StoresAdminResponse
    return NextResponse.json({
      stores: transformedStores,
      total: transformedStores.length,
      page: 1,
      limit: 100
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}