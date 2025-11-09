import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📊 [Currency API] Datos recibidos:', body);
    
    const { storeId, rate, userId } = body;

    // Validación
    if (!storeId) {
      console.error('❌ [Currency API] StoreId faltante');
      return NextResponse.json(
        { error: "StoreId es requerido" },
        { status: 400 }
      );
    }
    
    if (isNaN(rate) || rate <= 0) {
      console.error('❌ [Currency API] Tasa inválida:', rate);
      return NextResponse.json(
        { error: "Tasa debe ser un número válido mayor a 0" },
        { status: 400 }
      );
    }

    console.log('🔄 [Currency API] Desactivando tasas anteriores para storeId:', storeId);
    
    // 1. Desactivar todas las tasas anteriores
    const { error: updateError } = await supabase
      .from('currency_rates')
      .update({ active: false })
      .eq('store_id', storeId);

    if (updateError) {
      console.error('❌ [Currency API] Error desactivando tasas:', updateError);
      throw new Error('Error al desactivar tasas anteriores');
    }

    // 2. Crear nueva tasa activa
    const rateData = {
      id: 'RAT-' + Date.now(),
      store_id: storeId,
      rate: Number(rate),
      date: new Date().toISOString(),
      created_by: userId || 'system',
      active: true
    };
    
    console.log('💾 [Currency API] Creando nueva tasa:', rateData);
    
    const { data: newRate, error: insertError } = await supabase
      .from('currency_rates')
      .insert(rateData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Currency API] Error creando tasa:', insertError);
      throw new Error('Error al crear nueva tasa');
    }
    
    console.log('✅ [Currency API] Tasa creada exitosamente:', newRate.id);

    return NextResponse.json({ 
      success: true,
      data: newRate 
    });

  } catch (error: any) {
    console.error('❌ [Currency API] Error completo:', error);
    
    return NextResponse.json(
      { 
        error: error.message || "Error al guardar tasa",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: "Se requiere storeId" },
        { status: 400 }
      );
    }

    // Obtener tasa activa actual
    const { data: currentRate, error: currentError } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('❌ [Currency API] Error obteniendo tasa actual:', currentError);
    }

    // Obtener historial (últimas 10)
    const { data: history, error: historyError } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('❌ [Currency API] Error obteniendo historial:', historyError);
    }

    return NextResponse.json({ 
      success: true,
      data: {
        current: currentRate,
        history: history || []
      }
    });

  } catch (error: any) {
    console.error('❌ [Currency API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}