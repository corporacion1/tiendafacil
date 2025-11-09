import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { comparePassword } from '@/lib/auth'; // Usa tu función existente

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    console.log('🔐 [Login API] Usando tabla users con auth.ts helpers');

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

    // Buscar usuario en TU tabla users
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
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

    // Verificar contraseña usando TU función de auth.ts
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

    // Crear token
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

    console.log('✅ [Login API] Login exitoso para:', user.email);

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