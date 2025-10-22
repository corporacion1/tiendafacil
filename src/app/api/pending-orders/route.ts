import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { OrderStatus } from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    
    // Solo obtener órdenes con estado 'pending'
    const pendingOrders = await Order.find({ 
      storeId, 
      status: OrderStatus.PENDING 
    }).lean();
    
    return NextResponse.json(pendingOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.orderId || !data.storeId || !data.items) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }
    
    // Asegurar que el status sea 'pending' para nuevas órdenes
    const orderData = {
      ...data,
      status: OrderStatus.PENDING
    };
    
    const created = await Order.create(orderData);
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.orderId || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'orderId' y 'storeId'" }, { status: 400 });
    }
    
    const updated = await Order.findOneAndUpdate(
      { orderId: data.orderId, storeId: data.storeId },
      { $set: data },
      { new: true }
    );
    
    if (!updated) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const storeId = searchParams.get('storeId');
    
    if (!orderId || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'orderId' y/o 'storeId'" }, { status: 400 });
    }
    
    const deleted = await Order.findOneAndDelete({ orderId, storeId });
    if (!deleted) return NextResponse.json({ error: "Orden no existe" }, { status: 404 });
    return NextResponse.json({ message: "Orden eliminada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
