import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// GET /api/users - Obtener todos los usuarios (solo para superadmin)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    logDatabaseOperation('GET', 'users', { storeId });
    
    let users;
    if (storeId) {
      // Filtrar usuarios por storeId
      users = await User.find({ storeId }).sort({ createdAt: -1 }).lean();
    } else {
      // Devolver todos los usuarios (para superadmin)
      users = await User.find({}).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json(users);
  } catch (error) {
    return handleDatabaseError(error, 'GET users');
  }
}

// POST /api/users - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    if (!body.email || !body.displayName) {
      return NextResponse.json({ error: 'email y displayName son requeridos' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'users', body);

    const newUser = new User({
      ...body,
      uid: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const savedUser = await newUser.save();
    return NextResponse.json(savedUser, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, 'POST users');
  }
}

// PUT /api/users - Actualizar un usuario
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { uid, ...updateData } = body;

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    logDatabaseOperation('PUT', 'users', { uid, ...updateData });

    const updatedUser = await User.findOneAndUpdate(
      { uid: uid },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handleDatabaseError(error, 'PUT users');
  }
}

// DELETE /api/users - Eliminar un usuario
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    logDatabaseOperation('DELETE', 'users', { uid });

    const deletedUser = await User.findOneAndDelete({ uid: uid });

    if (!deletedUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE users');
  }
}