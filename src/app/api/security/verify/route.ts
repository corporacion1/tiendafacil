import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { data: securityConfig, error } = await supabase
      .from('store_security')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) {
      console.error('❌ [Security Verify] Error obteniendo configuración:', error);
      return NextResponse.json(
        { 
          error: 'Configuración de seguridad no encontrada',
          isValid: false 
        },
        { status: 404 }
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
      
      await supabase
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

      await supabase
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