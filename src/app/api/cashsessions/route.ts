import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionStatus } from '@/models/CashSession';
import { IDGenerator } from '@/lib/id-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Mapear datos a la estructura de Supabase
    const sessionData = {
      id: data.id,
      store_id: data.storeId,
      user_id: data.openedBy, // openedBy -> user_id
      opening_amount: data.openingBalance, // openingBalance -> opening_amount
      status: SessionStatus.OPEN,
      opened_at: new Date().toISOString(),
      // Inicializar todos los totales en 0
      total_sales: 0,
      total_cash: 0,
      total_card: 0,
      total_transfer: 0,
      total_other: 0,
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
    
    console.log('✅ [CashSessions API] Sesión creada:', created.id);
    
    return NextResponse.json(created);
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
      
      // TODO: Necesito saber la estructura de la tabla 'sales' para hacer el cálculo equivalente
      // Por ahora, usar la lógica simplificada
      const calculatedCash = currentSession.opening_amount + (currentSession.total_cash || 0);
      const difference = data.closingBalance - calculatedCash;
      
      // Actualizar datos de cierre
      updateData.closing_amount = data.closingBalance;
      updateData.closed_at = new Date().toISOString();
      
      console.log('📊 [CashSessions API] Cálculos de cierre:', {
        openingBalance: currentSession.opening_amount,
        cashFromSales: currentSession.total_cash,
        calculatedCash,
        closingBalance: data.closingBalance,
        difference
      });
    }
    
    // Si se está actualizando el balance de apertura
    if (data.openingBalance !== undefined) {
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
    
    console.log('✅ [CashSessions API] Sesión actualizada:', updated.id);
    return NextResponse.json(updated);
    
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