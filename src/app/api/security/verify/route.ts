import { NextResponse } from 'next/server';
import { dbAdmin as db } from '@/lib/db-client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { pin, storeId } = await request.json();

    if (!pin || !storeId) {
      return NextResponse.json(
        { error: 'PIN y storeId son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔐 [Security Verify] Verificando PIN para store:', storeId);

    // Obtener configuración de seguridad
    const { data: securityConfig, error } = await db
      .from('store_security')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) {
      console.error('❌ [Security Verify] Error obteniendo configuración:', error);

      // If no security config exists, treat as if PIN is not required (allow operation)
      // Check for various "not found" error conditions
      if (!securityConfig || (error as any)?.code === 'PGRST116' || (error as any)?.details?.includes('0 rows')) {
        console.log('ℹ️ [Security Verify] No security config found - allowing operation (PIN not configured)');
        return NextResponse.json({
          isValid: true,
          isLocked: false,
          remainingAttempts: 5,
          message: 'No PIN configured'
        });
      }

      return NextResponse.json(
        {
          error: 'Error al verificar configuración de seguridad',
          isValid: false
        },
        { status: 500 }
      );
    }

    // Verificar si está bloqueado
    if (securityConfig.is_locked) {
      return NextResponse.json({
        isValid: false,
        isLocked: true,
        remainingAttempts: 0,
        error: 'Sistema bloqueado. Contacta al administrador.'
      });
    }

    // Verificar PIN
    const isValid = await bcrypt.compare(pin, securityConfig.pin_hash);

    let remainingAttempts = securityConfig.remaining_attempts;
    let isLocked = securityConfig.is_locked;

    if (isValid) {
      // Resetear intentos en éxito
      remainingAttempts = 5;
      isLocked = false;

      await db
        .from('store_security')
        .update({
          remaining_attempts: remainingAttempts,
          is_locked: isLocked,
          last_accessed: new Date().toISOString()
        })
        .eq('store_id', storeId);

      console.log('✅ [Security Verify] PIN válido para store:', storeId);

    } else {
      // Decrementar intentos
      remainingAttempts = Math.max(0, remainingAttempts - 1);
      isLocked = remainingAttempts === 0;

      await db
        .from('store_security')
        .update({
          remaining_attempts: remainingAttempts,
          is_locked: isLocked
        })
        .eq('store_id', storeId);

      console.log('❌ [Security Verify] PIN inválido. Intentos restantes:', remainingAttempts);
    }

    return NextResponse.json({
      isValid,
      isLocked,
      remainingAttempts,
      error: !isValid ? (isLocked ?
        'Demasiados intentos fallidos. Sistema bloqueado.' :
        'PIN incorrecto. Intentos restantes: ' + remainingAttempts
      ) : undefined
    });

  } catch (error: any) {
    console.error('❌ [Security Verify] Error inesperado:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        isValid: false
      },
      { status: 500 }
    );
  }
}