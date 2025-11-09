import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { currentPin, newPin, storeId } = await request.json();

    if (!newPin || !storeId) {
      return NextResponse.json(
        { error: 'Nuevo PIN y storeId son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔐 [Security PIN] Configurando PIN para store:', storeId);

    // Verificar PIN actual si se proporciona (para cambio)
    if (currentPin) {
      const { data: existingConfig } = await supabase
        .from('store_security')
        .select('pin_hash')
        .eq('store_id', storeId)
        .single();

      if (existingConfig?.pin_hash) {
        const isCurrentValid = await bcrypt.compare(currentPin, existingConfig.pin_hash);
        if (!isCurrentValid) {
          return NextResponse.json(
            { error: 'PIN actual incorrecto' },
            { status: 401 }
          );
        }
      }
    }

    // Hash del nuevo PIN
    const saltRounds = 12;
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    // Insertar o actualizar configuración
    const { data, error } = await supabase
      .from('store_security')
      .upsert({
        store_id: storeId,
        pin_hash: pinHash,
        remaining_attempts: 5,
        is_locked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ [Security PIN] Error de Supabase:', error);
      return NextResponse.json(
        { error: 'Error guardando configuración de PIN' },
        { status: 500 }
      );
    }

    console.log('✅ [Security PIN] PIN configurado exitosamente para store:', storeId);

    return NextResponse.json({
      success: true,
      message: 'PIN configurado correctamente'
    });

  } catch (error: any) {
    console.error('❌ [Security PIN] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔐 [Security PIN] Eliminando PIN para store:', storeId);

    const { error } = await supabase
      .from('store_security')
      .delete()
      .eq('store_id', storeId);

    if (error) {
      console.error('❌ [Security PIN] Error eliminando PIN:', error);
      return NextResponse.json(
        { error: 'Error eliminando PIN' },
        { status: 500 }
      );
    }

    console.log('✅ [Security PIN] PIN eliminado para store:', storeId);

    return NextResponse.json({
      success: true,
      message: 'PIN eliminado correctamente'
    });

  } catch (error: any) {
    console.error('❌ [Security PIN] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}