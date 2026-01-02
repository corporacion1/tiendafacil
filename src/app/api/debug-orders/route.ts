import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');
  const customerEmail = searchParams.get('customerEmail');


  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
  }

  try {
    // CONSULTA DIRECTA A LA DB - SIN NINGUNA TRANSFORMACIÓN
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
      query = query.limit(10);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [DEBUG ORDERS] Error:', error);
      throw error;
    }

    // DEVOLVER DATOS CRUDOS DE LA BASE DE DATOS
    return NextResponse.json({
      count: data?.length || 0,
      orders: data || [],
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ [DEBUG ORDERS] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
