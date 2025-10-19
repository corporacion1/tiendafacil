// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Por ahora, solo simulamos verificación exitosa
    // En producción, verificarías un JWT token real
    
    return NextResponse.json({
      user: {
        id: 'demo-user',
        email: 'demo@tiendafacil.com',
        role: 'user'
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