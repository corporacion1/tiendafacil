// src/app/api/debug/reproduce-login-error/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔄 [Reproduce Login Error] Simulando el error exacto del AuthContext...');

    // Simular exactamente lo que hace AuthContext
    const email = 'demo@tiendafacil.com';
    const password = 'password_incorrecto'; // Contraseña incorrecta para generar error

    console.log('🔐 Intentando login con:', email);
    
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Respuesta del servidor:', res.status);

    let data;
    const contentType = res.headers.get('content-type');
    
    console.log('🔍 Content-Type:', contentType);
    console.log('🔍 Response status:', res.status, res.statusText);

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        console.log('📊 Datos recibidos (JSON):', data);
        console.log('📊 Tipo de datos:', typeof data);
        console.log('📊 Keys de datos:', data ? Object.keys(data) : 'data es null/undefined');
      } else {
        const text = await res.text();
        console.log('📄 Respuesta como texto:', text);
        data = { error: 'NOT_JSON', rawText: text };
      }
    } catch (parseError) {
      console.error('❌ Error parseando respuesta:', parseError);
      data = { error: 'PARSE_ERROR', parseError: parseError.message };
    }

    console.log('🔍 Verificando condiciones de login...');
    console.log('🔍 res.ok:', res.ok);
    console.log('🔍 data.success:', data?.success);
    console.log('🔍 data:', data);

    if (res.ok && data?.success) {
      console.log('✅ Login exitoso (inesperado en este test)');
    } else {
      console.log('❌ Login falló - analizando respuesta...');
      
      const errorInfo = {
        status: res.status,
        statusText: res.statusText,
        data: data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null,
        error: data?.error || 'UNKNOWN_ERROR',
        success: data?.success,
        msg: data?.msg,
        hasData: !!data,
        dataStringified: JSON.stringify(data)
      };
      
      console.error('❌ Error del servidor (reproducido):', errorInfo);
    }

    return NextResponse.json({
      success: true,
      message: 'Error de login reproducido exitosamente',
      reproduction: {
        requestData: { email, password: '***' },
        response: {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          contentType
        },
        parsedData: data,
        analysis: {
          dataExists: !!data,
          dataType: typeof data,
          dataKeys: data ? Object.keys(data) : null,
          hasError: !!data?.error,
          hasMsg: !!data?.msg,
          hasSuccess: !!data?.success
        }
      }
    });

  } catch (error: any) {
    console.error('❌ [Reproduce Login Error] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error reproduciendo el error de login',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}