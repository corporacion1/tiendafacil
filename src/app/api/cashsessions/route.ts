import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CashSession, SessionStatus } from '@/models/CashSession';
import { Sale } from '@/models/Sale';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // Construir query
    const query: any = { storeId };
    if (status) {
      query.status = status;
    }
    
    console.log('🔍 [CashSessions API] Buscando sesiones:', query);
    
    const cashSessions = await CashSession.find(query)
      .sort({ openingDate: -1 })
      .limit(limit)
      .lean();
    
    console.log('📊 [CashSessions API] Sesiones encontradas:', cashSessions.length);
    
    return NextResponse.json(cashSessions);
  } catch (error: any) {
    console.error('❌ [CashSessions API] Error en GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('session');
    }
    
    // Validar campos requeridos
    if (!data.storeId || !data.openedBy || data.openingBalance === undefined) {
      return NextResponse.json({ 
        error: "Campos requeridos: storeId, openedBy, openingBalance" 
      }, { status: 400 });
    }
    
    console.log('💰 [CashSessions API] Creando nueva sesión:', data.id);
    
    // Verificar que no hay sesión abierta
    const existingOpenSession = await CashSession.findOne({
      storeId: data.storeId,
      status: SessionStatus.OPEN
    });
    
    if (existingOpenSession) {
      return NextResponse.json({ 
        error: "Ya existe una sesión de caja abierta para esta tienda",
        existingSession: existingOpenSession 
      }, { status: 409 });
    }
    
    // Crear nueva sesión
    const sessionData = {
      ...data,
      status: SessionStatus.OPEN,
      openingDate: new Date(),
      salesIds: [],
      transactions: new Map(),
      calculatedCash: data.openingBalance,
      xReports: 0
    };
    
    const created = await CashSession.create(sessionData);
    console.log('✅ [CashSessions API] Sesión creada:', created.id);
    
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('❌ [CashSessions API] Error creando sesión:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }
    
    console.log('🔄 [CashSessions API] Actualizando sesión:', data.id);
    
    // Si se está cerrando la sesión, calcular datos finales
    if (data.status === SessionStatus.CLOSED && data.closingBalance !== undefined) {
      console.log('🔒 [CashSessions API] Cerrando sesión con balance:', data.closingBalance);
      
      // Obtener la sesión actual para calcular el efectivo
      const currentSession = await CashSession.findOne({ 
        id: data.id, 
        storeId: data.storeId 
      });
      
      if (!currentSession) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }
      
      // Calcular efectivo basado en ventas
      const cashPayments = await Sale.aggregate([
        { $match: { storeId: data.storeId, id: { $in: currentSession.salesIds } } },
        { $unwind: '$payments' },
        { $match: { 'payments.method': 'Efectivo' } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]);
      
      const totalCashFromSales = cashPayments.length > 0 ? cashPayments[0].total : 0;
      const calculatedCash = currentSession.openingBalance + totalCashFromSales;
      const difference = data.closingBalance - calculatedCash;
      
      // Actualizar datos de cierre
      data.calculatedCash = calculatedCash;
      data.difference = difference;
      data.closingDate = new Date();
      
      console.log('📊 [CashSessions API] Cálculos de cierre:', {
        openingBalance: currentSession.openingBalance,
        cashFromSales: totalCashFromSales,
        calculatedCash,
        closingBalance: data.closingBalance,
        difference
      });
    }
    
    const updated = await CashSession.findOneAndUpdate(
      { id: data.id, storeId: data.storeId },
      { $set: data },
      { new: true, runValidators: true }
    );
    
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
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');
    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }
    const deleted = await CashSession.findOneAndDelete({ id, storeId });
    if (!deleted) return NextResponse.json({ error: "Sesión de caja no existe" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
