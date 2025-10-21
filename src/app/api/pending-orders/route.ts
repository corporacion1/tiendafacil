import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PendingOrder } from '@/models/PendingOrder';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    const pendingOrders = await PendingOrder.find({ storeId }).lean();
    return NextResponse.json(pendingOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.id || !data.storeId || !data.items) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }
    const created = await PendingOrder.create(data);
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }
    const updated = await PendingOrder.findOneAndUpdate(
      { id: data.id, storeId: data.storeId },
      { $set: data },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "Orden pendiente no encontrada" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');
    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }
    const deleted = await PendingOrder.findOneAndDelete({ id, storeId });
    if (!deleted) return NextResponse.json({ error: "Orden pendiente no existe" }, { status: 404 });
    return NextResponse.json({ message: "Orden pendiente eliminada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
