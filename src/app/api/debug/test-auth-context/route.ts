// src/app/api/debug/test-auth-context/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test de AuthContext - Usa las credenciales en el navegador',
    instructions: [
      '1. Abre la aplicación en el navegador',
      '2. Intenta hacer login con: demo@tiendafacil.com / user1234',
      '3. Revisa la consola del navegador para ver los logs detallados',
      '4. Los logs mostrarán exactamente dónde está fallando el proceso'
    ],
    credentials: {
      email: 'demo@tiendafacil.com',
      password: 'user1234'
    },
    expectedLogs: [
      '🔐 Intentando login con: demo@tiendafacil.com',
      '📡 Respuesta del servidor: 200',
      '📊 Datos recibidos: {...}',
      '🔍 [AuthContext] Verificando condiciones de login...',
      '🔍 [AuthContext] res.ok: true',
      '🔍 [AuthContext] data.success: true',
      '✅ [AuthContext] Condiciones de login exitoso cumplidas',
      '✅ Login exitoso - Sesión persistida'
    ]
  });
}