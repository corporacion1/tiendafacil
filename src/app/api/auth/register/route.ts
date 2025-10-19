// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User'; // 👈 IMPORTAMOS User (no default)
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    // 1. Conectar a MongoDB
    await connectToDatabase();
    console.log('🔌 Conectado a MongoDB');

    // 2. Leer datos del body
    const body = await request.json();
    const { email, password, phone, storeId } = body;

    console.log('📩 Datos recibidos:', { email, phone, storeId });

    // 3. Validar campos requeridos
    if (!email || !password || !phone || !storeId) {
      return NextResponse.json(
        { msg: 'Todos los campos son requeridos: email, password, phone, storeId.' },
        { status: 400 }
      );
    }

    // 4. Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ Email ya registrado:', email);
      return NextResponse.json(
        { msg: 'El correo electrónico ya está registrado.' },
        { status: 409 }
      );
    }

    // 5. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('🔒 Contraseña encriptada');

    // 6. Crear nuevo usuario
    const newUser = new User({
      uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique uid
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      storeId: storeId.trim(),
      role: 'user', // por defecto
    });

    // 7. Guardar en MongoDB
    await newUser.save();
    console.log('✅ Usuario guardado en MongoDB con ID:', newUser._id);

    // 8. Responder con éxito (sin la contraseña, por seguridad)
    return NextResponse.json({
        success: true,
        msg: 'Registro exitoso',
        token: 'fake-jwt-token-123',
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          phone: newUser.phone,
          storeId: newUser.storeId,
          role: newUser.role,
          displayName: newUser.email.split('@')[0],
        }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en /api/auth/register:', error);

    // Manejo de errores de validación de Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { msg: 'Datos inválidos proporcionados.' },
        { status: 400 }
      );
    }

    // Error genérico
    return NextResponse.json(
      { msg: 'Error interno del servidor. Inténtalo más tarde.' },
      { status: 500 }
    );
  }
}