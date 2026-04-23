import { NextResponse } from 'next/server';
import { comparePassword } from '@/lib/auth';
import { dbBridge } from '@/lib/sql-template-bridge';

export async function POST(request: Request) {
  try {
    console.log('🔐 [Login API] Usando base de datos local vía dbBridge');

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          msg: 'Email y contraseña son requeridos'
        },
        { status: 400 }
      );
    }

    console.log('👤 [Login API] Buscando usuario:', email);

    // Buscar usuario en la tabla local 'users' usando el bridge
    const { data: user, error } = await dbBridge
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      console.error('❌ [Login API] Error en query local:', error);
      return NextResponse.json(
        {
          success: false,
          msg: 'Error al buscar usuario localmente',
          error: error.message
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('❌ [Login API] Usuario no encontrado:', email);
      return NextResponse.json(
        {
          success: false,
          msg: 'Usuario no encontrado'
        },
        { status: 401 }
      );
    }

    console.log('🔍 [Login API] Usuario encontrado:', user.email, 'Role:', user.role);

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ [Login API] Contraseña incorrecta para:', email);
      return NextResponse.json(
        {
          success: false,
          msg: 'Contraseña incorrecta'
        },
        { status: 401 }
      );
    }

    console.log('✅ [Login API] Contraseña válida');

    // Crear token (como se hacía antes)
    const tokenPayload = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };

    const token = `tf-token-${btoa(JSON.stringify(tokenPayload))}`;

    // Respuesta exitosa (sin la contraseña)
    const { password: _, ...userWithoutPassword } = user;

    const responseData = {
      success: true,
      msg: 'Login exitoso',
      token: token,
      user: {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        role: user.role,
        status: user.status,
        storeId: user.store_id,
        storeRequest: user.store_request,
        phone: user.phone,
        createdAt: user.created_at
      }
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ [Login API] Error inesperado:', error);

    return NextResponse.json(
      {
        success: false,
        msg: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}