// src/app/api/debug/test-login-response/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🧪 [Test Login Response] Probando respuesta de login API...');

    const loginData = {
      email: 'demo@tiendafacil.com',
      password: 'user1234'
    };

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    console.log('📡 [Test Login Response] Status:', response.status);
    console.log('📡 [Test Login Response] Status Text:', response.statusText);
    console.log('📡 [Test Login Response] OK:', response.ok);

    const responseText = await response.text();
    console.log('📄 [Test Login Response] Raw Response:', responseText);

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
      console.log('📊 [Test Login Response] Parsed Data:', parsedData);
    } catch (parseError) {
      console.error('❌ [Test Login Response] Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Error parsing response',
        rawResponse: responseText,
        parseError: parseError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Login response test completed',
      response: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      },
      data: parsedData,
      analysis: {
        hasSuccessField: 'success' in parsedData,
        successValue: parsedData.success,
        hasUserField: 'user' in parsedData,
        hasTokenField: 'token' in parsedData,
        hasMsgField: 'msg' in parsedData
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Login Response] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error testing login response',
        error: error.message
      },
      { status: 500 }
    );
  }
}