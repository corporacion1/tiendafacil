// src/app/api/debug/test-improved-seed/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🧪 [Test Improved Seed] Probando función de seed mejorada...');

    // Llamar a la función de seed real con un storeId de test
    const testStoreId = 'test_improved_seed_789';
    
    const seedResponse = await fetch('http://localhost:3000/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: testStoreId })
    });

    const seedResult = await seedResponse.json();
    
    if (!seedResponse.ok) {
      throw new Error(`Seed failed: ${seedResult.error}`);
    }

    console.log('✅ [Test Improved Seed] Seed ejecutado exitosamente');

    // Verificar usuarios creados
    const verifyResponse = await fetch('http://localhost:3000/api/debug/migrate-all-users', {
      method: 'GET'
    });
    
    const verifyResult = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Test de seed mejorado completado',
      seedResult,
      verification: {
        totalUsers: verifyResult.stats?.totalUsers || 0,
        usersWithPassword: verifyResult.stats?.usersWithPassword || 0,
        usersWithoutPassword: verifyResult.stats?.usersWithoutPassword || 0
      },
      testStoreId
    });

  } catch (error: any) {
    console.error('❌ [Test Improved Seed] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de seed mejorado',
        error: error.message
      },
      { status: 500 }
    );
  }
}