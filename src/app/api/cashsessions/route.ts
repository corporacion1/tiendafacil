import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

enum SessionStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

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

    console.log('🔍 [CashSessions API] Buscando sesiones:', { storeId, status });

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
      console.error('❌ [CashSessions API] Error fetching:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (!data.id) {
      data.id = IDGenerator.generate('session');
    }

    if (!data.storeId || !data.openedBy || data.openingBalance === undefined) {
      return NextResponse.json({
        error: "Campos requeridos: storeId, openedBy, openingBalance"
      }, { status: 400 });
    }

    console.log('💰 [CashSessions API] Creando nueva sesión:', data.id);

    // Check for existing open session
    const { data: existingOpenSession, error: checkError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('store_id', data.storeId)
      .eq('status', SessionStatus.OPEN)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [CashSessions API] Error checking existing:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingOpenSession) {
      return NextResponse.json({
        error: "Ya existe una sesión de caja abierta para esta tienda",
        existingSession: existingOpenSession
      }, { status: 409 });
    }

    const sessionData = {
      id: data.id,
      store_id: data.storeId,
      series: data.series || null,
      user_id: data.openedBy,
      opened_by: data.openedBy,
      opening_balance: data.openingBalance,
      opening_amount: data.openingBalance,
      status: SessionStatus.OPEN,
      opening_date: new Date().toISOString(),
      opened_at: new Date().toISOString(),
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
      console.error('❌ [CashSessions API] Error creating:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const formattedSession = {
      ...created,
      storeId: created.store_id,
      series: created.series || null,
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

    console.log('🔄 [CashSessions API] PUT - Received data:', JSON.stringify(data, null, 2));

    // Check for required fields
    if (!data.id) {
      console.error('❌ [CashSessions API] Missing id field');
      return NextResponse.json({ error: "Campo requerido: 'id'" }, { status: 400 });
    }

    // storeId might be in the data or we need to fetch it
    let storeId = data.storeId;

    if (!storeId) {
      console.warn('⚠️ [CashSessions API] storeId not provided, fetching from session');
      // Fetch the session to get storeId
      const { data: session } = await supabase
        .from('cash_sessions')
        .select('store_id')
        .eq('id', data.id)
        .single();

      if (session) {
        storeId = session.store_id;
        console.log('✅ [CashSessions API] Found storeId:', storeId);
      } else {
        console.error('❌ [CashSessions API] Session not found:', data.id);
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }
    }

    console.log('🔄 [CashSessions API] Actualizando sesión:', data.id, 'Store:', storeId);

    // Prepare update data
    const updateData: any = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.salesIds !== undefined) updateData.sales_ids = data.salesIds;
    if (data.transactions !== undefined) updateData.transactions = data.transactions;

    // Handle closing session
    if (data.status === SessionStatus.CLOSED && data.closingBalance !== undefined) {
      console.log('🔒 [CashSessions API] Cerrando sesión con balance:', data.closingBalance);

      const { data: currentSession, error: fetchError } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        console.error('❌ [CashSessions API] Error fetching session:', fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      if (!currentSession) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }

      const openingBalance = currentSession.opening_balance ?? currentSession.opening_amount ?? 0;
      const cashFromSales = currentSession.total_cash || 0;
      const calculatedCash = openingBalance + cashFromSales;
      const difference = data.closingBalance - calculatedCash;
      const closingDate = new Date().toISOString();

      updateData.closing_balance = data.closingBalance;
      updateData.closing_amount = data.closingBalance;
      updateData.closing_date = closingDate;
      updateData.closed_at = closingDate;
      updateData.calculated_cash = calculatedCash;
      updateData.difference = difference;
      updateData.closed_by = data.closedBy || currentSession.opened_by;

      console.log('📊 [CashSessions API] Cálculos de cierre:', {
        openingBalance,
        cashFromSales,
        calculatedCash,
        closingBalance: data.closingBalance,
        difference
      });
    }

    if (data.openingBalance !== undefined) {
      updateData.opening_balance = data.openingBalance;
      updateData.opening_amount = data.openingBalance;
    }

    console.log('📝 [CashSessions API] Update data:', JSON.stringify(updateData, null, 2));

    const { data: updated, error: updateError } = await supabase
      .from('cash_sessions')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [CashSessions API] Error updating:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Sesión de caja no encontrada" }, { status: 404 });
    }

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
    console.error('❌ [CashSessions API] Error stack:', error.stack);
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
      console.error('❌ [CashSessions API] Error deleting:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!deleted) {
      return NextResponse.json({ error: "Sesión de caja no existe" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [CashSessions API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}