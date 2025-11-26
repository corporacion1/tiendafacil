// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // El token es un string base64 que contiene el payload
    // Formato: tf-token-BASE64_PAYLOAD
    if (!token.startsWith('tf-token-')) {
      return NextResponse.json(
        { error: 'Formato de token inválido' },
        { status: 401 }
      );
    }

    const base64Payload = token.replace('tf-token-', '');
    let decodedPayload;

    try {
      const jsonPayload = atob(base64Payload);
      decodedPayload = JSON.parse(jsonPayload);
    } catch (e) {
      return NextResponse.json(
        { error: 'Token corrupto' },
        { status: 401 }
      );
    }

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    // Buscar usuario en Supabase para asegurar que sigue existiendo/activo
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uid', decodedPayload.uid)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        role: user.role,
        storeId: user.store_id,
        phone: user.phone,
        displayName: user.display_name,
        photoURL: user.photo_url
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