import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Warehouse } from '@/models/Warehouse';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// GET /api/warehouses - Obtener almacenes por storeId
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    logDatabaseOperation('GET', 'warehouses', { storeId });
    const warehouses = await Warehouse.find({ storeId }).sort({ name: 1 }).lean();

    return NextResponse.json(warehouses);
  } catch (error) {
    return handleDatabaseError(error, 'GET warehouses');
  }
}

// POST /api/warehouses - Crear nuevo almacén
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'warehouses', body);

    const newWarehouse = new Warehouse({
      ...body,
      id: `warehouse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    const savedWarehouse = await newWarehouse.save();
    return NextResponse.json(savedWarehouse, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, 'POST warehouses');
  }
}

// PUT /api/warehouses - Actualizar almacén
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('PUT', 'warehouses', { id, ...updateData });

    const updatedWarehouse = await Warehouse.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true }
    );

    if (!updatedWarehouse) {
      return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedWarehouse);
  } catch (error) {
    return handleDatabaseError(error, 'PUT warehouses');
  }
}

// DELETE /api/warehouses - Eliminar almacén
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('DELETE', 'warehouses', { id });

    const deletedWarehouse = await Warehouse.findOneAndDelete({ id: id });

    if (!deletedWarehouse) {
      return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Almacén eliminado exitosamente' });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE warehouses');
  }
}