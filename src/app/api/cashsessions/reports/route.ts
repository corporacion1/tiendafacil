import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CashSession, SessionStatus } from '@/models/CashSession';
import { Sale } from '@/models/Sale';

// GET /api/cashsessions/reports - Generar reporte X o Z
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const reportType = searchParams.get('type'); // 'X' o 'Z'
    const storeId = searchParams.get('storeId');
    
    if (!sessionId || !reportType || !storeId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: sessionId, type (X/Z), storeId' 
      }, { status: 400 });
    }
    
    console.log(`📊 [Reports API] Generando reporte ${reportType} para sesión:`, sessionId);
    
    // Obtener la sesión
    const session = await CashSession.findOne({ 
      id: sessionId, 
      storeId 
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }
    
    // Obtener ventas de la sesión
    const sales = await Sale.find({ 
      storeId,
      id: { $in: session.salesIds }
    }).lean();
    
    console.log(`📊 [Reports API] Ventas encontradas:`, sales.length);
    
    // Calcular totales por método de pago
    const paymentTotals: Record<string, number> = {};
    let totalSales = 0;
    let totalItems = 0;
    let totalTax = 0;
    
    sales.forEach(sale => {
      totalSales += sale.total || 0;
      totalItems += sale.items?.length || 0;
      
      // Procesar pagos
      if (sale.payments && Array.isArray(sale.payments)) {
        sale.payments.forEach(payment => {
          const method = payment.method || 'Efectivo';
          paymentTotals[method] = (paymentTotals[method] || 0) + (payment.amount || 0);
        });
      }
      
      // Calcular impuestos (si están implementados)
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          // Aquí se calcularían los impuestos si están configurados
          // Por ahora asumimos 0
        });
      }
    });
    
    // Calcular efectivo
    const cashFromSales = paymentTotals['Efectivo'] || 0;
    const calculatedCash = session.openingBalance + cashFromSales;
    
    // Preparar reporte
    const report = {
      sessionId: session.id,
      storeId: session.storeId,
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: 'system', // En producción sería el usuario actual
      
      // Información de la sesión
      session: {
        openingDate: session.openingDate,
        closingDate: session.closingDate,
        openedBy: session.openedBy,
        closedBy: session.closedBy,
        status: session.status,
        xReports: session.xReports || 0
      },
      
      // Balances
      balances: {
        openingBalance: session.openingBalance,
        closingBalance: session.closingBalance,
        calculatedCash,
        difference: session.difference || 0
      },
      
      // Totales de ventas
      sales: {
        count: sales.length,
        totalAmount: totalSales,
        totalItems,
        totalTax,
        averageTicket: sales.length > 0 ? totalSales / sales.length : 0
      },
      
      // Métodos de pago
      paymentMethods: paymentTotals,
      
      // Detalles de ventas
      salesDetails: sales.map(sale => ({
        id: sale.id,
        date: sale.date,
        customerName: sale.customerName,
        total: sale.total,
        items: sale.items?.length || 0,
        paymentMethod: sale.payments?.[0]?.method || 'Efectivo'
      }))
    };
    
    // Si es reporte X, incrementar contador
    if (reportType === 'X') {
      await CashSession.findOneAndUpdate(
        { id: sessionId, storeId },
        { $inc: { xReports: 1 } }
      );
      console.log('📊 [Reports API] Contador de reportes X incrementado');
    }
    
    console.log('✅ [Reports API] Reporte generado exitosamente');
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('❌ [Reports API] Error generando reporte:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cashsessions/reports - Cerrar sesión y generar reporte Z
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { sessionId, storeId, closingBalance, closedBy } = data;
    
    if (!sessionId || !storeId || closingBalance === undefined || !closedBy) {
      return NextResponse.json({ 
        error: 'Campos requeridos: sessionId, storeId, closingBalance, closedBy' 
      }, { status: 400 });
    }
    
    console.log('🔒 [Reports API] Cerrando sesión y generando reporte Z:', sessionId);
    
    // Cerrar la sesión
    const updatedSession = await CashSession.findOneAndUpdate(
      { id: sessionId, storeId, status: SessionStatus.OPEN },
      { 
        $set: {
          status: SessionStatus.CLOSED,
          closingBalance: Number(closingBalance),
          closedBy,
          closingDate: new Date()
        }
      },
      { new: true }
    );
    
    if (!updatedSession) {
      return NextResponse.json({ 
        error: 'Sesión no encontrada o ya está cerrada' 
      }, { status: 404 });
    }
    
    // Generar reporte Z automáticamente
    const reportResponse = await fetch(`${request.url}?sessionId=${sessionId}&type=Z&storeId=${storeId}`, {
      method: 'GET'
    });
    
    if (!reportResponse.ok) {
      console.warn('⚠️ [Reports API] Error generando reporte Z automático');
    }
    
    const report = reportResponse.ok ? await reportResponse.json() : null;
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      report
    });
    
  } catch (error) {
    console.error('❌ [Reports API] Error cerrando sesión:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}