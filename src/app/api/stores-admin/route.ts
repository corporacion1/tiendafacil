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
        .eq('store_id', storeId)
        .single();

      if (error) throw error;
      if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

      // Transformar snake_case a camelCase
      const transformedStore = {
        storeId: store.id,
        name: store.name,
        description: store.description,
        address: store.address,
        phone: store.phone,
        email: store.email,
        logoUrl: store.logo_url,
        status: store.status,
        subscriptionPlan: store.subscription_plan,
        createdAt: store.created_at,
        updatedAt: store.updated_at
      };

      return NextResponse.json(transformedStore);
    }

    // Si no, devolver todas las tiendas (admin)
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar snake_case a camelCase y agregar stats básicas
    const transformedStores = (stores || []).map((s: any) => ({
      storeId: s.id,  // La tabla stores usa 'id' no 'store_id'
      name: s.name,
      description: s.description,
      address: s.address,
      phone: s.phone,
      email: s.email,
      logoUrl: s.logo_url,
      status: s.status || 'active',
      subscriptionPlan: s.subscription_plan || 'free',
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      // Stats básicas (se pueden mejorar con queries adicionales)
      stats: {
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        activeUsers: 0
      }
    }));

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