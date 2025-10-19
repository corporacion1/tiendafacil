// src/app/api/debug/test-hashed-passwords/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🧪 [Test Hashed Passwords] Probando contraseñas hasheadas...');

    // Contraseñas hasheadas de data.ts
    const hashedPasswords = {
      'corporacion1@gmail.com': {
        hash: '$2b$10$3gbTS9Zq0BbLoU.cuPtRSu0qct6i7gIBzpgut.RN20YU6TgNTq8oy',
        plain: '19a1e3ef'
      },
      'admin@tiendafacil.com': {
        hash: '$2b$10$IsAzgDQFQvHej8wydhcHTuCv3mVsfA5/1lV6z3btXGEW5YhJpgVJ6',
        plain: 'admin1234'
      },
      'pos@tiendafacil.com': {
        hash: '$2b$10$Etj/Ge9Uwi1Nxb3B7Jw6muxiWagP8NaEfm/Zz9U9owX2IKaR1E89K',
        plain: 'seller1234'
      },
      'depositary@tiendafacil.com': {
        hash: '$2b$10$9v34cif1q92DBXuTgbZIGOJQPJ0mkdI.Tb45VBAakuBg.MfQdikY6',
        plain: 'depositary1234'
      },
      'demo@tiendafacil.com': {
        hash: '$2b$10$CJmToZSR.9RvbxutoobXk.w56UDFn.vBs8RrVWd4zpj6moLz6WC/y',
        plain: 'user1234'
      }
    };

    const testResults = [];

    for (const [email, { hash, plain }] of Object.entries(hashedPasswords)) {
      try {
        const isMatch = await bcrypt.compare(plain, hash);
        console.log(`🔑 [Test Hashed Passwords] ${email}: ${plain} vs hash -> ${isMatch}`);
        
        testResults.push({
          email,
          plainPassword: plain,
          hashMatches: isMatch,
          hashPreview: hash.substring(0, 20) + '...'
        });
      } catch (error) {
        console.error(`❌ [Test Hashed Passwords] Error testing ${email}:`, error);
        testResults.push({
          email,
          plainPassword: plain,
          hashMatches: false,
          error: error.message
        });
      }
    }

    const allMatch = testResults.every(r => r.hashMatches);

    return NextResponse.json({
      success: allMatch,
      message: allMatch ? 'Todas las contraseñas hasheadas funcionan correctamente' : 'Algunas contraseñas no coinciden',
      testResults,
      summary: {
        total: testResults.length,
        matching: testResults.filter(r => r.hashMatches).length,
        failing: testResults.filter(r => !r.hashMatches).length
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Hashed Passwords] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error probando contraseñas hasheadas',
        error: error.message
      },
      { status: 500 }
    );
  }
}