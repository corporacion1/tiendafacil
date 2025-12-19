import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IDGenerator } from '@/lib/id-generator';

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

    let fromCurrency = body.fromCurrency;
    let toCurrency = body.toCurrency;

    if (!fromCurrency || !toCurrency) {
      // Obtener configuración de la tienda para usar las monedas correctas
      const { data: storeSettings, error: storeError } = await supabase
        .from('stores')
        .select('primary_currency, secondary_currency')
        .eq('id', storeId)
        .single();

      if (storeError) {
        console.error('❌ [Currency API] Error obteniendo configuración de tienda:', storeError);
      }

      fromCurrency = fromCurrency || storeSettings?.primary_currency || 'USD';
      toCurrency = toCurrency || storeSettings?.secondary_currency || 'VES';
    }

    // Crear nueva tasa
    const rateData = {
      id: IDGenerator.generate('rates'),
      store_id: storeId,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: Number(rate),
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
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

    // Obtener historial (últimas 10 tasas, ordenadas por fecha)
    const { data: history, error: historyError } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('❌ [Currency API] Error obteniendo historial:', historyError);
    }

    // La tasa más reciente es la "actual"
    const currentRate = history && history.length > 0 ? history[0] : null;

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