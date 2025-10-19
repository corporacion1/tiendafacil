import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Unit } from '@/models/Unit';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// GET /api/units - Obtener unidades por storeId
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    logDatabaseOperation('GET', 'units', { storeId });
    const units = await Unit.find({ storeId }).sort({ name: 1 }).lean();

    return NextResponse.json(units);
  } catch (error) {
    return handleDatabaseError(error, 'GET units');
  }
}

// POST /api/units - Crear nueva unidad
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'units', body);

    const newUnit = new Unit({
      ...body,
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    const savedUnit = await newUnit.save();
    return NextResponse.json(savedUnit, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, 'POST units');
  }
}

// PUT /api/units - Actualizar unidad
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('PUT', 'units', { id, ...updateData });

    const updatedUnit = await Unit.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true }
    );

    if (!updatedUnit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(updatedUnit);
  } catch (error) {
    return handleDatabaseError(error, 'PUT units');
  }
}

// DELETE /api/units - Eliminar unidad
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('DELETE', 'units', { id });

    const deletedUnit = await Unit.findOneAndDelete({ id: id });

    if (!deletedUnit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unidad eliminada exitosamente' });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE units');
  }
}