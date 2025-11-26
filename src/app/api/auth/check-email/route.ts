// src/app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? 'Email ya registrado' : 'Email disponible'
    });

  } catch (error: any) {
    console.error('Error en check-email:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}