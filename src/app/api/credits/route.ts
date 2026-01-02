import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// GET /api/credits - Obtener cuentas por cobrar
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const customerId = searchParams.get('customerId');
    const saleId = searchParams.get('saleId');
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    const limit = parseInt(searchParams.get('limit') || '50');
    const creditDays = parseInt(searchParams.get('creditDays') || '7');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    console.log('🔍 [Credits API] Buscando cuentas por cobrar:', { storeId, customerId, status, overdue });

    // Construir query - Simplificado sin JOIN complejo
    let query = supabaseAdmin
      .from('account_receivables')
      .select('*')
      .eq('store_id', storeId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (saleId) {
      query = query.eq('sale_id', saleId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (status === 'all') {
      // No status filter
    } else {
      // Por defecto, excluir las pagadas y canceladas
      query = query.in('status', ['pending', 'overdue']);
    }

    if (overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString());
      query = query.neq('status', 'paid');
    }

    const { data: accounts, error } = await query
      .order('due_date', { ascending: true })
      .order('sale_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Credits API] Error fetching accounts:', error);
      return NextResponse.json({ error: error.message, details: 'Error al consultar la tabla account_receivables' }, { status: 500 });
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
      payments: typeof account.payments === 'string' ? JSON.parse(account.payments) : (account.payments || []),
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
    const { saleId, creditDays, createdBy } = data;

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
      paid_amount: sale.paid_amount || 0,
      remaining_balance: sale.total - (sale.paid_amount || 0),
      status: sale.paid_amount >= sale.total ? 'paid' : 'pending',
      sale_date: sale.date,
      due_date: dueDate.toISOString(),
      last_payment_date: (sale.paid_amount > 0) ? new Date().toISOString() : null,
      payments: typeof sale.payments === 'string' ? JSON.parse(sale.payments) : (sale.payments || []),
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
      id: IDGenerator.generate('payment'),
      date: new Date().toISOString(),
      amount: payment.amount,
      method: payment.paymentMethod || 'cash',
      reference: payment.reference || null,
      type: payment.type || 'payment',
      notes: payment.notes || null,
      processedBy: payment.processedBy,
      processedAt: new Date().toISOString()
    };

    // Actualizar cuenta
    const currentPayments = typeof account.payments === 'string' ? JSON.parse(account.payments) : (account.payments || []);
    const updatedPayments = [...currentPayments, newPayment];
    const currentPaid = Number(account.paid_amount || 0);
    const currentRemaining = Number(account.remaining_balance || 0);
    const newPaidAmount = currentPaid + payment.amount;
    const newRemainingBalance = Math.max(0, currentRemaining - payment.amount);

    // Status para account_receivables
    const newStatus = newRemainingBalance <= 0.01 ? 'paid' : (new Date() > new Date(account.due_date) ? 'overdue' : 'pending');

    console.log('📝 [Credits API] Valores calculados:', {
      currentPaid,
      paymentAmount: payment.amount,
      newPaidAmount,
      newRemainingBalance,
      newStatus,
      paymentsCount: updatedPayments.length
    });

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

    // Sincronizar con la venta (Uso de snake_case para columnas de la BD)
    const saleIdToSync = account.sale_id || (account as any).saleId;
    const finalStatus = newStatus === 'paid' ? 'paid' : 'unpaid';

    if (saleIdToSync) {
      console.log('🔄 [Credits API] Sincronizando venta:', {
        saleId: saleIdToSync,
        storeId: account.store_id,
        newPaidAmount,
        finalStatus
      });

      const { data: syncData, error: syncError, count } = await supabaseAdmin
        .from('sales')
        .update({
          paid_amount: newPaidAmount,
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleIdToSync)
        .eq('store_id', account.store_id)
        .select('id');

      if (syncError) {
        console.error('❌ [Credits API] Error sincronizando venta:', syncError);
      } else {
        console.log(`✅ [Credits API] Venta sincronizada exitosamente. Filas afectadas: ${syncData?.length || 0}`);
        console.log(`📊 [Credits API] Nueva Info Venta - Paid: ${newPaidAmount}, Status: ${finalStatus}`);
      }
    }

    console.log('✅ [Credits API] Operación de abono completada');

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
      payments: typeof updatedAccount.payments === 'string' ? JSON.parse(updatedAccount.payments) : (updatedAccount.payments || []),
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
