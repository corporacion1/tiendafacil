// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verificar el token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      console.error('Token inválido:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Conectar a la base de datos y buscar el usuario
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Error en verify:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}