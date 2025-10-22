import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    console.log('🔍 [Debug] Checking orders for store:', storeId);
    
    // Obtener todos los pedidos para debug
    const allOrders = await Order.find(storeId ? { storeId } : {})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    console.log('📊 [Debug] Total orders found:', allOrders.length);
    
    // Contar por estado
    const statusCounts = await Order.aggregate([
      ...(storeId ? [{ $match: { storeId } }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📈 [Debug] Orders by status:', statusCounts);
    
    return NextResponse.json({
      success: true,
      storeId,
      totalOrders: allOrders.length,
      statusCounts,
      recentOrders: allOrders.map(order => ({
        orderId: order.orderId,
        status: order.status,
        customerName: order.customerName,
        total: order.total,
        createdAt: order.createdAt,
        storeId: order.storeId
      }))
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}