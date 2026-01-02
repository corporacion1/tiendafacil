import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { OrderTransformer } from '@/lib/order-transformer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Fetch ALL orders with complete data for reports
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Reports API] Database error:', error);
      return NextResponse.json({ error: 'Error fetching orders data' }, { status: 500 });
    }

    // Transform data using OrderTransformer for consistent mapping
    const transformedOrders = OrderTransformer.fromDatabaseArray(orders || []);

    return NextResponse.json(transformedOrders, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('❌ [Reports API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
