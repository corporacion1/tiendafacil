// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Sale } from '@/models/Sale';
import { Product } from '@/models/Product';
import { Customer } from '@/models/Customer';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    // Estadísticas de ventas
    const salesStats = await Sale.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          averageSale: { $avg: '$total' }
        }
      }
    ]);

    // Productos más vendidos
    const topProducts = await Sale.aggregate([
      { $match: { storeId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Estadísticas de inventario (solo productos físicos, no servicios)
    const inventoryStats = await Product.aggregate([
      { 
        $match: { 
          storeId,
          type: 'product' // Solo productos físicos
        } 
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          lowStockProducts: { 
            $sum: { 
              $cond: [{ $lt: ['$stock', 10] }, 1, 0] 
            } 
          },
          totalInventoryValue: { 
            $sum: { $multiply: ['$stock', '$price'] } 
          }
        }
      }
    ]);

    // Clientes frecuentes
    const topCustomers = await Sale.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerName' },
          totalSpent: { $sum: '$total' },
          purchaseCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    const stats = {
      sales: salesStats[0] || { totalSales: 0, totalTransactions: 0, averageSale: 0 },
      inventory: inventoryStats[0] || { totalProducts: 0, lowStockProducts: 0, totalInventoryValue: 0 },
      topProducts,
      topCustomers
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error: any) {
    console.error('Error en dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}