import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Family } from '@/models/Family';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/families - Obtener familias por storeId
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    logDatabaseOperation('GET', 'families', { storeId });
    const families = await Family.find({ storeId }).sort({ name: 1 }).lean();

    return NextResponse.json(families);
  } catch (error) {
    return handleDatabaseError(error, 'GET families');
  }
}

// POST /api/families - Crear nueva familia
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    if (!body.name || !body.storeId) {
      return NextResponse.json({ error: 'name y storeId son requeridos' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'families', body);

    const newFamily = new Family({
      ...body,
      id: IDGenerator.generate('family'),
    });

    const savedFamily = await newFamily.save();
    return NextResponse.json(savedFamily, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, 'POST families');
  }
}

// PUT /api/families - Actualizar familia
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('PUT', 'families', { id, ...updateData });

    const updatedFamily = await Family.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true }
    );

    if (!updatedFamily) {
      return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
    }

    return NextResponse.json(updatedFamily);
  } catch (error) {
    return handleDatabaseError(error, 'PUT families');
  }
}

// DELETE /api/families - Eliminar familia
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('DELETE', 'families', { id });

    const deletedFamily = await Family.findOneAndDelete({ id: id });

    if (!deletedFamily) {
      return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Familia eliminada exitosamente' });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE families');
  }
}