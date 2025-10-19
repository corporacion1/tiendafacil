// src/app/api/debug/test-login-errors/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🧪 [Test Login Errors] Probando diferentes escenarios de error...');

    const testCases = [
      {
        name: 'Usuario inexistente',
        email: 'usuario_inexistente@test.com',
        password: 'cualquier_password'
      },
      {
        name: 'Email válido, contraseña incorrecta',
        email: 'demo@tiendafacil.com',
        password: 'password_incorrecto'
      },
      {
        name: 'Email vacío',
        email: '',
        password: 'user1234'
      },
      {
        name: 'Contraseña vacía',
        email: 'demo@tiendafacil.com',
        password: ''
      },
      {
        name: 'Credenciales correctas (control)',
        email: 'demo@tiendafacil.com',
        password: 'user1234'
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        console.log(`🧪 [Test Login Errors] Probando: ${testCase.name}`);

        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testCase.email,
            password: testCase.password
          })
        });

        const responseText = await response.text();
        let parsedData;
        
        try {
          parsedData = JSON.parse(responseText);
        } catch (parseError) {
          parsedData = { parseError: 'Could not parse JSON', rawText: responseText };
        }

        results.push({
          testCase: testCase.name,
          email: testCase.email,
          password: testCase.password.length > 0 ? '***' : '(empty)',
          response: {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            data: parsedData
          }
        });

        console.log(`✅ [Test Login Errors] ${testCase.name}: ${response.status} ${response.statusText}`);

      } catch (testError) {
        console.error(`❌ [Test Login Errors] Error en ${testCase.name}:`, testError);
        results.push({
          testCase: testCase.name,
          email: testCase.email,
          password: testCase.password.length > 0 ? '***' : '(empty)',
          error: testError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test de errores de login completado',
      results,
      summary: {
        total: testCases.length,
        successful: results.filter(r => r.response?.ok).length,
        failed: results.filter(r => !r.response?.ok && !r.error).length,
        errors: results.filter(r => r.error).length
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Login Errors] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error testing login errors',
        error: error.message
      },
      { status: 500 }
    );
  }
}