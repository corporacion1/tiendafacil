// src/app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await dbAdmin
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