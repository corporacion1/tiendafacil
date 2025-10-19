import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { OrderStatus } from '@/models/Order';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const order = new Order({
      orderId: body.id,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      items: body.items,
      total: body.total,
      storeId: body.storeId,
      status: 'pending'
    });

    await order.save();
    return NextResponse.json({ success: true, data: order });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const phone = searchParams.get('phone');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 [Orders API] Búsqueda con parámetros:', { storeId, phone, id, status, limit });

    let query: any = {};
    
    // Filtro por ID específico (para QR scanning)
    if (id) {
      query.orderId = id;
      console.log('🎯 [Orders API] Buscando pedido específico:', id);
    }
    
    // Filtro por tienda
    if (storeId) {
      query.storeId = storeId;
    }
    
    // Filtro por teléfono del cliente
    if (phone) {
      query.customerPhone = phone;
    }
    
    // Filtro por estado
    if (status) {
      query.status = status;
    } else {
      // Por defecto, solo mostrar pedidos pendientes y en procesamiento
      query.status = { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('📊 [Orders API] Pedidos encontrados:', orders.length);

    // Si se busca por ID específico, devolver el pedido directamente
    if (id && orders.length > 0) {
      const order = orders[0];
      console.log('✅ [Orders API] Pedido encontrado:', order.orderId);
      
      // Convertir formato para compatibilidad con PendingOrder
      const formattedOrder = {
        id: order.orderId,
        date: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        total: order.total,
        storeId: order.storeId,
        status: order.status
      };
      
      return NextResponse.json(formattedOrder);
    }

    // Para búsquedas generales, devolver lista
    const formattedOrders = orders.map(order => ({
      id: order.orderId,
      date: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      total: order.total,
      storeId: order.storeId,
      status: order.status
    }));

    return NextResponse.json(formattedOrders);

  } catch (error: any) {
    console.error('❌ [Orders API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { orderId, status, processedBy, saleId, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json({ 
        error: 'orderId y status son requeridos' 
      }, { status: 400 });
    }

    console.log('🔄 [Orders API] Actualizando pedido:', orderId, 'a estado:', status);

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Si se marca como procesado, agregar campos adicionales
    if (status === OrderStatus.PROCESSED) {
      updateData.processedAt = new Date();
      if (processedBy) updateData.processedBy = processedBy;
      if (saleId) updateData.saleId = saleId;
    }

    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ 
        error: 'Pedido no encontrado' 
      }, { status: 404 });
    }

    console.log('✅ [Orders API] Pedido actualizado:', updatedOrder.orderId);

    // Convertir formato para compatibilidad
    const formattedOrder = {
      id: updatedOrder.orderId,
      date: updatedOrder.createdAt,
      customerName: updatedOrder.customerName,
      customerPhone: updatedOrder.customerPhone,
      items: updatedOrder.items,
      total: updatedOrder.total,
      storeId: updatedOrder.storeId,
      status: updatedOrder.status,
      processedAt: updatedOrder.processedAt,
      processedBy: updatedOrder.processedBy,
      saleId: updatedOrder.saleId
    };

    return NextResponse.json(formattedOrder);

  } catch (error: any) {
    console.error('❌ [Orders API] Error actualizando:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}