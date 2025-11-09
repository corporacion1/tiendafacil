import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔐 [Security Status] Verificando estado para store:', storeId);

    // Buscar configuración de seguridad en Supabase
    const { data: securityConfig, error } = await supabase
      .from('store_security')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ [Security Status] Error de Supabase:', error);
      return NextResponse.json(
        { error: 'Error consultando configuración de seguridad' },
        { status: 500 }
      );
    }

    const hasPin = !!securityConfig?.pin_hash;
    const isLocked = securityConfig?.is_locked || false;
    const remainingAttempts = securityConfig?.remaining_attempts || 5;

    console.log('✅ [Security Status] Estado obtenido:', {
      hasPin,
      isLocked,
      remainingAttempts
    });

    return NextResponse.json({
      hasPin,
      isLocked,
      remainingAttempts
    });

  } catch (error: any) {
    console.error('❌ [Security Status] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}