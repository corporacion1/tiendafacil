// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    // 1. Estadísticas de ventas
    // Nota: Para producción, esto debería ser una función RPC en Postgres
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('total, items, customer_id, customer_name')
      .eq('store_id', storeId);

    if (salesError) throw salesError;

    const totalSales = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const totalTransactions = sales?.length || 0;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // 2. Productos más vendidos
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};

    sales?.forEach(sale => {
      const items = sale.items || []; // Asumiendo que items es un array JSONB
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const pid = item.productId || item.product_id;
          if (!productSales[pid]) {
            productSales[pid] = {
              name: item.productName || item.product_name || 'Desconocido',
              quantity: 0,
              revenue: 0
            };
          }
          productSales[pid].quantity += (item.quantity || 0);
          productSales[pid].revenue += ((item.quantity || 0) * (item.price || 0));
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        _id: id,
        productName: data.name,
        totalSold: data.quantity,
        totalRevenue: data.revenue
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // 3. Clientes frecuentes
    const customerStats: Record<string, { name: string, spent: number, count: number }> = {};

    sales?.forEach(sale => {
      if (sale.customer_id) {
        const cid = sale.customer_id;
        if (!customerStats[cid]) {
          customerStats[cid] = {
            name: sale.customer_name || 'Cliente',
            spent: 0,
            count: 0
          };
        }
        customerStats[cid].spent += (sale.total || 0);
        customerStats[cid].count += 1;
      }
    });

    const topCustomers = Object.entries(customerStats)
      .map(([id, data]) => ({
        _id: id,
        customerName: data.name,
        totalSpent: data.spent,
        purchaseCount: data.count
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 4. Estadísticas de inventario
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('stock, price, type')
      .eq('store_id', storeId)
      .eq('type', 'product'); // Solo productos físicos

    if (productsError) throw productsError;

    const totalProducts = products?.length || 0;
    const lowStockProducts = products?.filter(p => (p.stock || 0) < 10).length || 0;
    const totalInventoryValue = products?.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0) || 0;

    const stats = {
      sales: { totalSales, totalTransactions, averageSale },
      inventory: { totalProducts, lowStockProducts, totalInventoryValue },
      topProducts,
      topCustomers
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error: any) {
    console.error('Error en dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}