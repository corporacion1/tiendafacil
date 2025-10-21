import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AccountReceivable, AccountStatus, PaymentType } from '@/models/AccountReceivable';
import { Sale } from '@/models/Sale';
import { CreditsSyncService } from '@/lib/credits-sync';

// GET /api/credits - Obtener cuentas por cobrar
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }
    
    console.log('🔍 [Credits API] Buscando cuentas por cobrar:', { storeId, customerId, status, overdue });
    
    // Construir query
    const query: any = { storeId };
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (status) {
      query.status = status;
    } else {
      // Por defecto, excluir las pagadas y canceladas
      query.status = { $nin: [AccountStatus.PAID, AccountStatus.CANCELLED] };
    }
    
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: [AccountStatus.PAID, AccountStatus.CANCELLED] };
    }
    
    const accounts = await AccountReceivable.find(query)
      .sort({ dueDate: 1, saleDate: -1 })
      .limit(limit)
      .lean();
    
    console.log('📊 [Credits API] Cuentas encontradas:', accounts.length);
    
    // Calcular totales
    const totals = {
      totalAccounts: accounts.length,
      totalAmount: accounts.reduce((sum, acc) => sum + acc.originalAmount, 0),
      totalPaid: accounts.reduce((sum, acc) => sum + acc.paidAmount, 0),
      totalPending: accounts.reduce((sum, acc) => sum + acc.remainingBalance, 0),
      overdueCount: accounts.filter(acc => new Date() > new Date(acc.dueDate) && acc.remainingBalance > 0).length
    };
    
    return NextResponse.json({
      success: true,
      accounts,
      totals
    });
    
  } catch (error: any) {
    console.error('❌ [Credits API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/credits - Crear cuenta por cobrar desde venta a crédito
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { saleId, creditDays = 30, createdBy } = data;
    
    if (!saleId || !createdBy) {
      return NextResponse.json({ 
        error: 'saleId y createdBy son requeridos' 
      }, { status: 400 });
    }
    
    console.log('💳 [Credits API] Creando cuenta por cobrar para venta:', saleId);
    
    // Obtener la venta
    const sale = await Sale.findOne({ id: saleId }).lean();
    if (!sale) {
      return NextResponse.json({ 
        error: 'Venta no encontrada' 
      }, { status: 404 });
    }
    
    // Verificar que sea una venta a crédito
    if ((sale as any).transactionType !== 'credito') {
      return NextResponse.json({ 
        error: 'La venta no es a crédito' 
      }, { status: 400 });
    }
    
    // Verificar si ya existe una cuenta por cobrar para esta venta
    const existingAccount = await AccountReceivable.findOne({ saleId });
    if (existingAccount) {
      return NextResponse.json({ 
        error: 'Ya existe una cuenta por cobrar para esta venta',
        account: existingAccount 
      }, { status: 409 });
    }
    
    // Calcular fechas
    const saleDate = new Date((sale as any).date);
    const dueDate = new Date(saleDate);
    dueDate.setDate(dueDate.getDate() + creditDays);
    
    // Crear cuenta por cobrar usando el servicio de sincronización
    const account = await CreditsSyncService.createAccountFromSale(saleId, createdBy, creditDays);
    
    console.log('✅ [Credits API] Cuenta por cobrar creada:', account.id);
    
    return NextResponse.json(account);
    
  } catch (error: any) {
    console.error('❌ [Credits API] Error creando cuenta:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/credits - Actualizar cuenta por cobrar (agregar pago)
export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { accountId, payment } = data;
    
    if (!accountId || !payment) {
      return NextResponse.json({ 
        error: 'accountId y payment son requeridos' 
      }, { status: 400 });
    }
    
    // Validar datos del pago
    if (!payment.amount || payment.amount <= 0) {
      return NextResponse.json({ 
        error: 'El monto del pago debe ser mayor a 0' 
      }, { status: 400 });
    }
    
    if (!payment.paymentMethod || !payment.processedBy) {
      return NextResponse.json({ 
        error: 'paymentMethod y processedBy son requeridos' 
      }, { status: 400 });
    }
    
    console.log('💰 [Credits API] Agregando pago a cuenta:', accountId, payment.amount);
    
    // Obtener cuenta actual
    const account = await AccountReceivable.findOne({ id: accountId });
    if (!account) {
      return NextResponse.json({ 
        error: 'Cuenta por cobrar no encontrada' 
      }, { status: 404 });
    }
    
    // Validar que el pago no exceda el balance pendiente
    if (payment.type === PaymentType.PAYMENT && payment.amount > account.remainingBalance) {
      return NextResponse.json({ 
        error: `El pago (${payment.amount}) no puede ser mayor al balance pendiente (${account.remainingBalance})` 
      }, { status: 400 });
    }
    
    // Validar referencias duplicadas para métodos que las requieren
    if (payment.reference && payment.reference.trim()) {
      const duplicateInAccount = await AccountReceivable.findOne({
        storeId: account.storeId,
        'payments.reference': payment.reference.trim(),
        'payments.paymentMethod': payment.paymentMethod
      });
      
      if (duplicateInAccount) {
        return NextResponse.json({ 
          error: `La referencia "${payment.reference}" ya existe para el método ${payment.paymentMethod}` 
        }, { status: 400 });
      }
      
      // También validar en el modelo Sale para compatibilidad
      const duplicateInSale = await Sale.findOne({
        storeId: account.storeId,
        'payments.reference': payment.reference.trim(),
        'payments.method': payment.paymentMethod
      });
      
      if (duplicateInSale) {
        return NextResponse.json({ 
          error: `La referencia "${payment.reference}" ya existe para el método ${payment.paymentMethod}` 
        }, { status: 400 });
      }
    }
    
    // Crear objeto de pago
    const newPayment = {
      id: `pay_${Date.now()}`,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      type: payment.type || PaymentType.PAYMENT,
      notes: payment.notes,
      processedBy: payment.processedBy,
      processedAt: new Date()
    };
    
    // Agregar pago a la cuenta
    account.payments.push(newPayment);
    account.lastPaymentDate = new Date();
    account.updatedBy = payment.processedBy;
    
    // Guardar (el middleware calculará automáticamente los totales)
    await account.save();
    
    // Sincronizar con el modelo Sale usando el servicio
    await CreditsSyncService.syncPaymentToSale(accountId, newPayment);
    console.log('🔄 [Credits API] Venta sincronizada:', account.saleId);
    
    console.log('✅ [Credits API] Pago agregado exitosamente');
    
    return NextResponse.json(account);
    
  } catch (error: any) {
    console.error('❌ [Credits API] Error agregando pago:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}