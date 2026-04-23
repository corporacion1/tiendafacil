// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    // 1. Leer datos del body
    const body = await request.json();
    const { email, password, phone, storeId } = body;

    console.log('📩 Datos recibidos:', { email, phone, storeId });

    // 2. Validar campos requeridos
    if (!email || !password || !phone || !storeId) {
      return NextResponse.json(
        { msg: 'Todos los campos son requeridos: email, password, phone, storeId.' },
        { status: 400 }
      );
    }

    // 3. Verificar si el email ya existe
    const { data: existingUser } = await dbAdmin
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('⚠️ Email ya registrado:', email);
      return NextResponse.json(
        { msg: 'El correo electrónico ya está registrado.' },
        { status: 409 }
      );
    }

    // 4. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('🔒 Contraseña encriptada');

    // 5. Crear nuevo usuario
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userData = {
      uid: uid,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      store_id: storeId.trim(), // snake_case para Database
      role: 'user',
      display_name: email.split('@')[0],
      created_at: new Date().toISOString(),
      status: 'active'
    };

    const { data: newUser, error } = await dbAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Usuario guardado en DB con UID:', newUser.uid);

    // 6. Responder con éxito
    return NextResponse.json({
      success: true,
      msg: 'Registro exitoso',
      token: 'fake-jwt-token-123', // Mantener compatibilidad temporal
      user: {
        id: newUser.uid,
        email: newUser.email,
        phone: newUser.phone,
        storeId: newUser.store_id,
        role: newUser.role,
        displayName: newUser.display_name,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error en /api/auth/register:', error);

    return NextResponse.json(
      { msg: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}