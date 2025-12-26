import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';
import { revalidateTag } from 'next/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    const { data: sales, error } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ [Sales API] Error fetching sales:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase
    const formattedSales = sales?.map((sale: any) => ({
      id: sale.id,
      ticketNumber: sale.ticket_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name,
      customerPhone: sale.customer_phone,
      items: sale.items,
      total: sale.total,
      date: sale.date,
      transactionType: sale.transaction_type,
      status: sale.status,
      paidAmount: sale.paid_amount,
      payments: sale.payments,
      storeId: sale.store_id,
      creditDueDate: sale.credit_due_date,
      userId: sale.user_id,
      customerRifNit: sale.customer_rif_nit
    })) || [];

    return NextResponse.json(formattedSales);
  } catch (error: any) {
    console.error('❌ [Sales API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('📥 [Sales API] Creating sale:', { id: data.id, storeId: data.storeId, itemsCount: data.items?.length });

    if (!data.storeId || !data.items) {
      return NextResponse.json({ error: 'storeId and items are required' }, { status: 400 });
    }

    const saleId = data.id || IDGenerator.generate('sale');

    // Prepare sale data
    const saleData: any = {
      id: saleId,
      customer_id: data.customerId || null,
      customer_phone: data.customerPhone || null,
      customer_address: data.customerAddress || null,
      customer_rif_nit: data.customerRifNit || data.customer_rif_nit || data.rif_nit || null,
      ticket_number: data.ticketNumber || null,
      customer_name: data.customerName || 'Cliente Eventual',
      items: data.items,
      total: data.total || 0,
      subtotal: data.subtotal || data.total || 0,
      tax: data.tax || 0,
      discount: data.discount || 0,
      payment_method: data.paymentMethod || (data.payments && data.payments.length > 0 ? data.payments[0].method : null),
      date: data.date || new Date().toISOString(),
      transaction_type: data.transactionType || 'contado',
      status: data.status || 'paid',
      payments: (data.payments || []).map((payment: any) => ({
        ...payment,
        id: payment.id || IDGenerator.generate('payment')
      })),
      store_id: data.storeId,
      user_id: data.userId || 'system',
      paid_amount: data.paidAmount || 0,
      series: data.series || null // Agregar serie para filtrar por punto de venta
    };

    console.log('💰 [Sales API] Inserting sale:', saleId);

    // Insert sale. Some deployments may not yet have the optional customer_* columns
    // (customer_phone, customer_address, customer_card_id). Try once with them,
    // and if the insert fails due to missing columns, retry without those fields
    // and return the client-provided values as a fallback in the response.
    let createdSale: any = null;
    const attemptInsert = async (payload: any) => {
      const res = await supabaseAdmin
        .from('sales')
        .insert([payload])
        .select()
        .single();
      return res;
    };

    const firstAttempt = await attemptInsert(saleData);

    if (firstAttempt.error) {
      const errMsg = (firstAttempt.error.message || '').toLowerCase();
      // Detect common Postgres/Supabase messages about missing columns
      const missingColumnDetected = errMsg.includes('could not find') || errMsg.includes('does not exist') || errMsg.includes('column') && errMsg.includes('does not exist');

      if (missingColumnDetected) {
        console.warn('⚠️ [Sales API] Insert failed due to missing column(s). Retrying without optional fields. Error:', firstAttempt.error.message);

        const retryData: any = { ...saleData };
        // Remove optional customer fields
        delete retryData.customer_phone;
        delete retryData.customer_address;
        delete retryData.customer_rif_nit;
        // Remove optional credit and series fields
        delete retryData.series;
        //delete retryData.paid_amount;
        //delete retryData.transaction_type;

        const retryAttempt = await attemptInsert(retryData);
        if (retryAttempt.error) {
          console.error('❌ [Sales API] Error creating sale (retry):', retryAttempt.error);
          return NextResponse.json({ error: retryAttempt.error.message || retryAttempt.error }, { status: 500 });
        }

        createdSale = retryAttempt.data;
        // Keep track that the values weren't persisted; we'll include them in the response from the original request body
        createdSale.__preservedClientValues = {
          customer_phone: saleData.customer_phone,
          customer_address: saleData.customer_address,
          customer_rif_nit: saleData.customer_rif_nit
        };
      } else {
        console.error('❌ [Sales API] Error creating sale:', firstAttempt.error);
        return NextResponse.json({ error: firstAttempt.error.message }, { status: 500 });
      }
    } else {
      createdSale = firstAttempt.data;
      console.log('✅ [Sales API] Sale created:', saleId);
    }

    // NOTE: account receivables will be created later using the persisted `createdSale` record

    // Create inventory movements for each item
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Sales API] Creating inventory movements...');

      for (const item of data.items) {
        try {
          // Get current product stock and cost
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock, cost')
            .eq('id', item.productId)
            .eq('store_id', data.storeId)
            .single();

          if (product) {
            const previousStock = product.stock || 0;
            const newStock = previousStock - item.quantity;

            // Update product stock
            await supabaseAdmin
              .from('products')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', item.productId)
              .eq('store_id', data.storeId);

            // Create movement record with correct Supabase column names (user provided schema)
            const movementData = {
              id: IDGenerator.generate('movement'),
              product_id: item.productId,
              store_id: data.storeId,
              warehouse_id: null,
              movement_type: 'sale',
              quantity: item.quantity,
              previous_stock: previousStock,
              new_stock: newStock,
              reference_type: saleId,
              user_id: data.userId || 'system',
              notes: `Sale ${saleId}`,
              unit_cost: product.cost || 0,
              total_value: (product.cost || 0) * item.quantity,
              batch_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { error: movementError } = await supabaseAdmin
              .from('inventory_movements')
              .insert(movementData);

            if (movementError) {
              console.error(`❌ [Sales API] Movement error for ${item.productId}:`, movementError);
            } else {
              console.log(`✅ [Sales API] Movement created for product ${item.productId}`);
            }
          }
        } catch (movementError: any) {
          console.warn(`⚠️ [Sales API] Error creating movement for ${item.productId}:`, movementError.message);
        }
      }

      console.log('✅ [Sales API] Inventory movements completed');
    }

    // --- AUTOMATIC ACCOUNT RECEIVABLE CREATION (use persisted createdSale to ensure correctness) ---
    // Determine creditDays/creditDueDate from request (data) or defaults based on createdSale.date
    const computedCreditDays = (data && data.creditDays !== undefined) ? data.creditDays : 0;
    const saleDateForDue = new Date(createdSale.date || new Date());
    const defaultDueDateForCreated = new Date(saleDateForDue);
    defaultDueDateForCreated.setDate(defaultDueDateForCreated.getDate() + (computedCreditDays || 0));

    if (data.transactionType === 'credito' || data.status === 'unpaid' || createdSale.transaction_type === 'credito') {
      try {
        console.log('💳 [Sales API] Creating account receivable for credit sale...');

        const creditDays = computedCreditDays || 0;
        const creditDueDate = (data && data.creditDueDate) ? data.creditDueDate : defaultDueDateForCreated.toISOString();

        const accountData = {
          id: IDGenerator.generate('account'),
          store_id: createdSale.store_id,
          sale_id: createdSale.id,
          customer_id: createdSale.customer_id,
          customer_name: createdSale.customer_name,
          original_amount: createdSale.total,
          paid_amount: createdSale.paid_amount || 0,
          remaining_balance: createdSale.total - (createdSale.paid_amount || 0),
          status: (createdSale.paid_amount >= createdSale.total) ? 'paid' : 'pending',
          sale_date: createdSale.date,
          due_date: creditDueDate,
          credit_days: creditDays || null,
          last_payment_date: (createdSale.paid_amount > 0) ? new Date().toISOString() : null,
          payments: typeof createdSale.payments === 'string' ? JSON.parse(createdSale.payments) : (createdSale.payments || []),
          notes: null,
          created_by: createdSale.user_id,
          updated_by: createdSale.user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: accountError } = await supabaseAdmin
          .from('account_receivables')
          .insert(accountData);

        if (accountError) {
          console.error('❌ [Sales API] Error automatically creating account receivable:', accountError);
        } else {
          console.log('✅ [Sales API] Account receivable created automatically');
        }
      } catch (accError) {
        console.error('❌ [Sales API] unexpected error creating account receivable:', accError);
      }
    }
    // ---------------------------------------------

    // Format response
    // Build response using persisted values when available, otherwise fall back
    // to the original request's client-supplied values for customer fields.
    const persisted = createdSale || {};
    const preservedClient = persisted.__preservedClientValues || {};

    const formattedResponse = {
      id: persisted.id,
      ticketNumber: persisted.ticket_number,
      customerId: persisted.customer_id || data.customerId || null,
      customerRifNit: persisted.customer_rif_nit || preservedClient.customer_rif_nit || data.customerRifNit || data.customer_rif_nit || data.rif_nit || null,
      customerAddress: persisted.customer_address || preservedClient.customer_address || data.customerAddress || data.customer_address || null,
      customerName: persisted.customer_name || data.customerName || data.customer_name || 'Cliente Eventual',
      customerPhone: persisted.customer_phone || preservedClient.customer_phone || data.customerPhone || data.customer_phone || null,
      items: persisted.items || data.items,
      total: persisted.total || data.total || 0,
      date: persisted.date || data.date,
      transactionType: persisted.transaction_type || data.transactionType,
      status: persisted.status || data.status,
      paidAmount: persisted.paid_amount || data.paidAmount || 0,
      payments: persisted.payments || data.payments || [],
      storeId: persisted.store_id || data.storeId,
      creditDays: (data && data.creditDays !== undefined) ? data.creditDays : null,
      creditDueDate: (data && data.creditDueDate) ? data.creditDueDate : (computedCreditDays !== undefined ? defaultDueDateForCreated.toISOString() : null),
      userId: persisted.user_id || data.userId
    };

    // Invalidar cache de productos para que se actualice el stock
    revalidateTag(`products-${createdSale.store_id}`);
    revalidateTag('products');

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Sales API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.customerId !== undefined) updateData.customer_id = data.customerId;
    if (data.customerName !== undefined) updateData.customer_name = data.customerName;
    if (data.customerPhone !== undefined) updateData.customer_phone = data.customerPhone;
    if (data.items !== undefined) updateData.items = data.items;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.transactionType !== undefined) updateData.transaction_type = data.transactionType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paidAmount !== undefined) updateData.paid_amount = data.paidAmount;
    if (data.payments !== undefined) updateData.payments = data.payments;
    if (data.creditDays !== undefined) updateData.credit_days = data.creditDays;
    if (data.creditDueDate !== undefined) updateData.credit_due_date = data.creditDueDate;
    if (data.userId !== undefined) updateData.user_id = data.userId;
    if (data.customerRifNit !== undefined) updateData.customer_rif_nit = data.customerRifNit;

    const { data: updatedSale, error } = await supabaseAdmin
      .from('sales')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Sales API] Error updating sale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const formattedResponse = {
      id: updatedSale.id,
      ticketNumber: updatedSale.ticket_number,
      customerId: updatedSale.customer_id,
      customerName: updatedSale.customer_name,
      customerPhone: updatedSale.customer_phone,
      items: updatedSale.items,
      total: updatedSale.total,
      date: updatedSale.date,
      transactionType: updatedSale.transaction_type,
      status: updatedSale.status,
      paidAmount: updatedSale.paid_amount,
      payments: updatedSale.payments,
      storeId: updatedSale.store_id,
      creditDays: updatedSale.credit_days,
      creditDueDate: updatedSale.credit_due_date,
      userId: updatedSale.user_id,
      customerRifNit: updatedSale.customer_rif_nit
    };

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Sales API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      console.error('❌ [Sales API] Error deleting sale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sale deleted successfully' });

  } catch (error: any) {
    console.error('❌ [Sales API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}