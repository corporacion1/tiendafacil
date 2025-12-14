import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/credits - Obtener cuentas por cobrar
export async function GET(request: Request) {
  try {
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
    let query = supabaseAdmin
      .from('account_receivables')
      .select('*')
      .eq('store_id', storeId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Por defecto, excluir las pagadas y canceladas
      query = query.in('status', ['pending', 'overdue']);
    }

    if (overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString());
    }

    const { data: accounts, error } = await query
      .order('due_date', { ascending: true })
      .order('sale_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Credits API] Error fetching accounts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📊 [Credits API] Cuentas encontradas:', accounts?.length || 0);

    // Transformar snake_case a camelCase
    const transformedAccounts = (accounts || []).map((account: any) => ({
      id: account.id,
      storeId: account.store_id,
      saleId: account.sale_id,
      customerId: account.customer_id,
      customerName: account.customer_name,
      originalAmount: account.original_amount,
      paidAmount: account.paid_amount,
      remainingBalance: account.remaining_balance,
      status: account.status,
      saleDate: account.sale_date,
      dueDate: account.due_date,
      creditDays: account.credit_days,
      lastPaymentDate: account.last_payment_date,
      payments: account.payments || [],
      notes: account.notes,
      createdBy: account.created_by,
      updatedBy: account.updated_by,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));

    // Calcular totales
    const totals = {
      totalAccounts: transformedAccounts.length,
      totalAmount: transformedAccounts.reduce((sum: number, acc: any) => sum + acc.originalAmount, 0),
      totalPaid: transformedAccounts.reduce((sum: number, acc: any) => sum + acc.paidAmount, 0),
      totalPending: transformedAccounts.reduce((sum: number, acc: any) => sum + acc.remainingBalance, 0),
      overdueCount: transformedAccounts.filter((acc: any) =>
        new Date() > new Date(acc.dueDate) && acc.remainingBalance > 0
      ).length
    };

    return NextResponse.json({
      success: true,
      accounts: transformedAccounts,
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
    const data = await request.json();
    const { saleId, creditDays = 30, createdBy } = data;

    if (!saleId || !createdBy) {
      return NextResponse.json({
        error: 'saleId y createdBy son requeridos'
      }, { status: 400 });
    }

    console.log('💳 [Credits API] Creando cuenta por cobrar para venta:', saleId);

    // Obtener la venta
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError || !sale) {
      return NextResponse.json({
        error: 'Venta no encontrada'
      }, { status: 404 });
    }

    // Verificar que sea una venta a crédito
    if (sale.transaction_type !== 'credito') {
      return NextResponse.json({
        error: 'La venta no es a crédito'
      }, { status: 400 });
    }

    // Verificar si ya existe una cuenta por cobrar para esta venta
    const { data: existingAccount } = await supabaseAdmin
      .from('account_receivables')
      .select('*')
      .eq('sale_id', saleId)
      .single();

    if (existingAccount) {
      return NextResponse.json({
        error: 'Ya existe una cuenta por cobrar para esta venta',
        account: existingAccount
      }, { status: 409 });
    }

    // Calcular fechas
    const saleDate = new Date(sale.date);
    const dueDate = new Date(saleDate);
    dueDate.setDate(dueDate.getDate() + creditDays);

    // Crear cuenta por cobrar
    const accountData = {
      id: IDGenerator.generate('account'),
      store_id: sale.store_id,
      sale_id: saleId,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name,
      original_amount: sale.total,
      paid_amount: sale.paidAmount || 0,
      remaining_balance: sale.total - (sale.paidAmount || 0),
      status: sale.paidAmount >= sale.total ? 'paid' : 'pending',
      sale_date: sale.date,
      due_date: dueDate.toISOString(),
      last_payment_date: sale.paidAmount > 0 ? new Date().toISOString() : null,
      payments: sale.payments || [],
      notes: null,
      created_by: createdBy,
      updated_by: createdBy
    };

    const { data: account, error } = await supabaseAdmin
      .from('account_receivables')
      .insert(accountData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Credits API] Error creando cuenta:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [Credits API] Cuenta por cobrar creada:', account.id);

    // Transformar respuesta
    const response = {
      id: account.id,
      storeId: account.store_id,
      saleId: account.sale_id,
      customerId: account.customer_id,
      customerName: account.customer_name,
      originalAmount: account.original_amount,
      paidAmount: account.paid_amount,
      remainingBalance: account.remaining_balance,
      status: account.status,
      saleDate: account.sale_date,
      dueDate: account.due_date,
      lastPaymentDate: account.last_payment_date,
      payments: account.payments || [],
      notes: account.notes,
      createdBy: account.created_by,
      updatedBy: account.updated_by,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ [Credits API] Error creando cuenta:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/credits - Actualizar cuenta por cobrar (agregar pago)
export async function PUT(request: Request) {
  try {
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
    const { data: account, error: accountError } = await supabaseAdmin
      .from('account_receivables')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({
        error: 'Cuenta por cobrar no encontrada'
      }, { status: 404 });
    }

    // Validar que el pago no exceda el balance pendiente
    if (payment.amount > account.remaining_balance) {
      return NextResponse.json({
        error: `El pago (${payment.amount}) no puede ser mayor al balance pendiente (${account.remaining_balance})`
      }, { status: 400 });
    }

    // Validar referencias duplicadas
    if (payment.reference && payment.reference.trim()) {
      const { data: duplicateAccount } = await supabaseAdmin
        .from('account_receivables')
        .select('*')
        .eq('store_id', account.store_id)
        .like('payments', `%${payment.reference.trim()}%`)
        .neq('id', accountId);

      if (duplicateAccount && duplicateAccount.length > 0) {
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
      reference: payment.reference || null,
      type: payment.type || 'payment',
      notes: payment.notes || null,
      processedBy: payment.processedBy,
      processedAt: new Date().toISOString()
    };

    // Actualizar cuenta
    const updatedPayments = [...(account.payments || []), newPayment];
    const newPaidAmount = account.paid_amount + payment.amount;
    const newRemainingBalance = account.remaining_balance - payment.amount;
    const newStatus = newRemainingBalance <= 0 ? 'paid' :
      (new Date() > new Date(account.due_date) ? 'overdue' : 'pending');

    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('account_receivables')
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: newRemainingBalance,
        status: newStatus,
        payments: updatedPayments,
        last_payment_date: new Date().toISOString(),
        updated_by: payment.processedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Credits API] Error actualizando cuenta:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sincronizar con la venta
    await supabaseAdmin
      .from('sales')
      .update({
        paidAmount: newPaidAmount,
        status: newStatus === 'paid' ? 'completed' : 'pending',
        payments: updatedPayments,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.sale_id);

    console.log('🔄 [Credits API] Venta sincronizada:', account.sale_id);
    console.log('✅ [Credits API] Pago agregado exitosamente');

    // Transformar respuesta
    const response = {
      id: updatedAccount.id,
      storeId: updatedAccount.store_id,
      saleId: updatedAccount.sale_id,
      customerId: updatedAccount.customer_id,
      customerName: updatedAccount.customer_name,
      originalAmount: updatedAccount.original_amount,
      paidAmount: updatedAccount.paid_amount,
      remainingBalance: updatedAccount.remaining_balance,
      status: updatedAccount.status,
      saleDate: updatedAccount.sale_date,
      dueDate: updatedAccount.due_date,
      lastPaymentDate: updatedAccount.last_payment_date,
      payments: updatedAccount.payments || [],
      notes: updatedAccount.notes,
      createdBy: updatedAccount.created_by,
      updatedBy: updatedAccount.updated_by,
      createdAt: updatedAccount.created_at,
      updatedAt: updatedAccount.updated_at
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ [Credits API] Error agregando pago:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
