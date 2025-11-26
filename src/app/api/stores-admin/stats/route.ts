import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Obtener conteo de tiendas
    const { count: totalStores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true });

    if (storesError) throw storesError;

    // Obtener conteo de usuarios
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Obtener tiendas activas
    const { count: activeStores, error: activeError } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) throw activeError;

    return NextResponse.json({
      totalStores: totalStores || 0,
      totalUsers: totalUsers || 0,
      activeStores: activeStores || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}