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
      creditDays: sale.credit_days,
      creditDueDate: sale.credit_due_date,
      userId: sale.user_id
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
      paid_amount: data.paidAmount || 0
    };

    console.log('💰 [Sales API] Inserting sale:', saleId);

    // Insert sale
    const { data: createdSale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (saleError) {
      console.error('❌ [Sales API] Error creating sale:', saleError);
      return NextResponse.json({ error: saleError.message }, { status: 500 });
    }

    console.log('✅ [Sales API] Sale created:', saleId);

    // Create Account Receivable if Credit Sale or Unpaid
    // This replaces the SQL trigger logic to allow removing redundant columns from 'sales' table
    if (data.transactionType === 'credito' || data.status === 'unpaid') {
      try {
        // Calculate due date
        const creditDays = data.creditDays || 0;
        const saleDate = new Date(data.date || new Date());
        const defaultDueDate = new Date(saleDate);
        defaultDueDate.setDate(defaultDueDate.getDate() + creditDays);

        const receivableData = {
          store_id: data.storeId,
          customer_id: data.customerId,
          customer_name: data.customerName,
          customer_phone: data.customerPhone, // Ideally passed from frontend, or null
          original_amount: data.total,
          paid_amount: data.paidAmount || 0,
          remaining_balance: data.total - (data.paidAmount || 0),
          due_date: data.creditDueDate || defaultDueDate.toISOString(),
          sale_id: saleId,
          sale_date: data.date || new Date().toISOString(),
          status: (data.total - (data.paidAmount || 0)) <= 0 ? 'paid' : ((data.paidAmount || 0) > 0 ? 'partial' : 'pending'),
          credit_days: creditDays,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: receivableError } = await supabaseAdmin
          .from('account_receivables')
          .insert(receivableData);

        if (receivableError) {
          console.error('❌ [Sales API] Error creating receivable:', receivableError);
          // Critical error, but we don't want to fail the sale? 
          // Better to log loudly. In a real tx, we'd rollback.
        } else {
          console.log('✅ [Sales API] Account Receivable created manually');
        }
      } catch (err) {
        console.error('❌ [Sales API] Exception creating receivable:', err);
      }
    }

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

    // --- AUTOMATIC ACCOUNT RECEIVABLE CREATION ---
    if (saleData.transaction_type === 'credito') {
      try {
        console.log('💳 [Sales API] Creating account receivable for credit sale...');

        const accountData = {
          id: IDGenerator.generate('account'),
          store_id: saleData.store_id,
          sale_id: saleId,
          customer_id: saleData.customer_id,
          customer_name: saleData.customer_name,
          original_amount: saleData.total,
          paid_amount: saleData.paidAmount || 0,
          remaining_balance: saleData.total - (saleData.paidAmount || 0),
          status: (saleData.paidAmount >= saleData.total) ? 'paid' : 'pending',
          sale_date: saleData.date,
          due_date: saleData.creditDueDate || new Date(new Date().setDate(new Date().getDate() + (saleData.creditDays || 30))).toISOString(),
          last_payment_date: (saleData.paidAmount > 0) ? new Date().toISOString() : null,
          payments: saleData.payments || [],
          notes: null,
          created_by: saleData.user_id,
          updated_by: saleData.user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: accountError } = await supabaseAdmin
          .from('account_receivables')
          .insert(accountData);

        if (accountError) {
          console.error('❌ [Sales API] Error automatically creating account receivable:', accountError);
          // Note: We don't fail the sale creation here, but we log the error.
        } else {
          console.log('✅ [Sales API] Account receivable created automatically');
        }
      } catch (accError) {
        console.error('❌ [Sales API] unexpected error creating account receivable:', accError);
      }
    }
    // ---------------------------------------------

    // Format response
    const formattedResponse = {
      id: createdSale.id,
      customerId: createdSale.customer_id,
      customerName: createdSale.customer_name,
      customerPhone: createdSale.customer_phone,
      items: createdSale.items,
      total: createdSale.total,
      date: createdSale.date,
      transactionType: createdSale.transaction_type,
      status: createdSale.status,
      paidAmount: createdSale.paid_amount,
      payments: createdSale.payments,
      storeId: createdSale.store_id,
      creditDays: createdSale.credit_days,
      creditDueDate: createdSale.credit_due_date,
      userId: createdSale.user_id
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
      userId: updatedSale.user_id
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