import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

enum SessionStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

// Usar supabaseAdmin en lugar de crear un nuevo cliente
const supabase = supabaseAdmin;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    // Construir query - MANTENIENDO EXACTAMENTE LA MISMA LÓGICA
    const query: any = { storeId };
    if (status) {
      query.status = status;
    }

    console.log('🔍 [CashSessions API] Buscando sesiones:', query);

    let supabaseQuery = supabase
      .from('cash_sessions')
      .select('*')
      .eq('store_id', storeId)
      .order('opened_at', { ascending: false })
      .limit(limit);

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    const { data: cashSessions, error } = await supabaseQuery;

    if (error) {
      throw error;
    }

    console.log('📊 [CashSessions API] Sesiones encontradas:', cashSessions?.length || 0);

    return NextResponse.json(cashSessions || []);
  } catch (error: any) {
    console.error('❌ [CashSessions API] Error en GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generar ID único si no se proporciona - MANTENIENDO EXACTAMENTE LA MISMA LÓGICA
    if (!data.id) {
      data.id = IDGenerator.generate('session');
    }

    // Validar campos requeridos - MANTENIENDO EXACTAMENTE LA MISMA LÓGICA
    if (!data.storeId || !data.openedBy || data.openingBalance === undefined) {
      return NextResponse.json({
        error: "Campos requeridos: storeId, openedBy, openingBalance"
      }, { status: 400 });
    }

    console.log('💰 [CashSessions API] Creando nueva sesión:', data.id);

    // Verificar que no hay sesión abierta - MANTENIENDO EXACTAMENTE LA MISMA LÓGICA
    const { data: existingOpenSession, error: checkError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('store_id', data.storeId)
      .eq('status', SessionStatus.OPEN)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingOpenSession) {
      return NextResponse.json({
        error: "Ya existe una sesión de caja abierta para esta tienda",
        existingSession: existingOpenSession
      }, { status: 409 });
    }

    // Mapear datos a la estructura de Supabase (usando las nuevas columnas)
    const sessionData = {
      id: data.id,
      store_id: data.storeId,
      user_id: data.openedBy, // Mantener por compatibilidad
      opened_by: data.openedBy, // Nueva columna
      opening_balance: data.openingBalance, // Nueva columna
      opening_amount: data.openingBalance, // Mantener por compatibilidad
      status: SessionStatus.OPEN,
      opening_date: new Date().toISOString(), // Nueva columna
      opened_at: new Date().toISOString(), // Mantener por compatibilidad
      // Inicializar todos los totales en 0
      total_sales: 0,
      total_cash: 0,
      total_card: 0,
      total_transfer: 0,
      total_other: 0,
      calculated_cash: 0,
      difference: 0,
      sales_ids: [],
      transactions: {},
      notes: data.notes || ''
    };

    const { data: created, error: createError } = await supabase
      .from('cash_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Formatear respuesta para coincidir con CashSession type
    const formattedSession = {
      ...created,
      storeId: created.store_id,
      openingBalance: created.opening_balance,
      openingDate: created.opening_date,
      openedBy: created.opened_by,
      salesIds: created.sales_ids || [],
      transactions: created.transactions || {}
    };

    console.log('✅ [CashSessions API] Sesión creada:', created.id);

    return NextResponse.json(formattedSession);
  } catch (error: any) {
    console.error('❌ [CashSessions API] Error creando sesión:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }

    console.log('🔄 [CashSessions API] Actualizando sesión:', data.id);

    // Preparar datos para actualizar
    const updateData: any = {};

    // Mapear campos si existen
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.salesIds !== undefined) updateData.sales_ids = data.salesIds;
    if (data.transactions !== undefined) updateData.transactions = data.transactions;

    // Si se está cerrando la sesión, calcular datos finales
    if (data.status === SessionStatus.CLOSED && data.closingBalance !== undefined) {
      console.log('🔒 [CashSessions API] Cerrando sesión con balance:', data.closingBalance);

      // Obtener la sesión actual para calcular el efectivo
      const { data: currentSession, error: fetchError } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('id', data.id)
        .eq('store_id', data.storeId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!currentSession) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }

      // Usar opening_balance si existe, sino fallback a opening_amount
      const openingBalance = currentSession.opening_balance ?? currentSession.opening_amount ?? 0;
      const cashFromSales = currentSession.total_cash || 0;

      const calculatedCash = openingBalance + cashFromSales;
      const difference = data.closingBalance - calculatedCash;
      const closingDate = new Date().toISOString();

      // Actualizar datos de cierre (nuevas y viejas columnas)
      updateData.closing_balance = data.closingBalance;
      updateData.closing_amount = data.closingBalance;
      updateData.closing_date = closingDate;
      updateData.closed_at = closingDate;
      updateData.calculated_cash = calculatedCash;
      updateData.difference = difference;
      updateData.closed_by = data.closedBy || currentSession.opened_by; // Asumir mismo usuario si no se envía

      console.log('📊 [CashSessions API] Cálculos de cierre:', {
        openingBalance,
        cashFromSales,
        calculatedCash,
        closingBalance: data.closingBalance,
        difference
      });
    }

    // Si se está actualizando el balance de apertura
    if (data.openingBalance !== undefined) {
      updateData.opening_balance = data.openingBalance;
      updateData.opening_amount = data.openingBalance;
    }

    const { data: updated, error: updateError } = await supabase
      .from('cash_sessions')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!updated) {
      return NextResponse.json({ error: "Sesión de caja no encontrada" }, { status: 404 });
    }

    // Formatear respuesta
    const formattedSession = {
      ...updated,
      storeId: updated.store_id,
      openingBalance: updated.opening_balance,
      openingDate: updated.opening_date,
      closingBalance: updated.closing_balance,
      closingDate: updated.closing_date,
      openedBy: updated.opened_by,
      closedBy: updated.closed_by,
      calculatedCash: updated.calculated_cash,
      difference: updated.difference,
      salesIds: updated.sales_ids || [],
      transactions: updated.transactions || {}
    };

    console.log('✅ [CashSessions API] Sesión actualizada:', updated.id);
    return NextResponse.json(formattedSession);

  } catch (error: any) {
    console.error('❌ [CashSessions API] Error actualizando sesión:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }

    const { data: deleted, error } = await supabase
      .from('cash_sessions')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!deleted) {
      return NextResponse.json({ error: "Sesión de caja no existe" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}