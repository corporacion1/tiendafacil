import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para generar IDs
const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    // Obtener ventas de Supabase
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching sales from Supabase:', error);
      return NextResponse.json(
        { error: 'No se pudo obtener la lista de ventas', detalles: error.message },
        { status: 500 }
      );
    }

    // Mapear campos de Supabase a tu formato actual
    const formattedSales = sales?.map(sale => ({
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
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la lista de ventas', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    console.log('📥 [Sales API] Raw body received:', bodyText.substring(0, 200) + '...');

    if (!bodyText) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const data = JSON.parse(bodyText);
    console.log('📥 [Sales API] Parsed data:', {
      id: data.id,
      storeId: data.storeId,
      itemsCount: data.items?.length
    });

    // Validaciones básicas
    if (!data.storeId || !data.items) {
      console.error('❌ [Sales API] Missing required fields:', { storeId: data.storeId, items: !!data.items });
      return NextResponse.json({ error: "Campos requeridos faltantes (storeId, items)" }, { status: 400 });
    }

    // Generar ID único si no se proporciona
    const saleId = data.id || generateId('SALE');

    // Preparar datos para Supabase
    const saleData: any = {
      id: saleId,
      customer_id: data.customerId || null,
      customer_name: data.customerName || 'Cliente Eventual',
      items: data.items,
      total: data.total || 0,
      date: data.date || new Date().toISOString(),
      transaction_type: data.transactionType || 'contado',
      status: data.status || 'paid',
      payments: (data.payments || []).map((payment: any) => ({
        ...payment,
        id: payment.id || generateId('PAY')
      })),
      store_id: data.storeId,
      user_id: data.userId || 'system'
    };

    // Solo agregar campos opcionales si están definidos Y si existen en la base de datos
    // TODO: Descomentar estos campos cuando se actualice el esquema de la base de datos
    /*
    if (data.customerPhone) {
      saleData.customer_phone = data.customerPhone;
    }
    if (data.paidAmount !== undefined && data.paidAmount !== null) {
      saleData.paid_amount = data.paidAmount;
    }
    if (data.creditDays !== undefined && data.creditDays !== null) {
      saleData.credit_days = data.creditDays;
    }
    if (data.creditDueDate !== undefined && data.creditDueDate !== null) {
      saleData.credit_due_date = data.creditDueDate;
    }
    */

    console.log('💰 [Sales API] Inserting sale into Supabase:', saleId);

    // Insertar venta en Supabase
    const { data: createdSale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (saleError) {
      console.error('❌ [Sales API] Supabase insert error:', saleError);
      return NextResponse.json(
        {
          error: 'Error al crear la venta',
          detalles: saleError.message || JSON.stringify(saleError),
          code: saleError.code || 'UNKNOWN'
        },
        { status: 500 }
      );
    }

    console.log('✅ [Sales API] Sale created successfully:', saleId);

    // 📦 Registrar movimientos de inventario usando MovementService
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Sales API] Starting inventory movements for:', saleId);
      console.log('📦 [Sales API] Items to process:', JSON.stringify(data.items, null, 2));
      try {
        console.log('📦 [Sales API] Importing MovementService...');
        const { MovementService } = await import('@/services/MovementService');

        // Mapear items al formato esperado por MovementService
        const saleItems = data.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || 'Producto',
          quantity: Number(item.quantity),
          price: Number(item.price || 0)
        }));

        console.log('📦 [Sales API] Mapped sale items:', JSON.stringify(saleItems, null, 2));
        console.log('📦 [Sales API] Calling recordSaleMovements with:', {
          saleId,
          itemCount: saleItems.length,
          userId: data.userId || 'system',
          storeId: data.storeId,
          warehouseId: 'main'
        });

        const movements = await MovementService.recordSaleMovements(
          saleId,
          saleItems,
          data.userId || 'system',
          data.storeId,
          'main' // TODO: Detectar almacén correcto si es necesario
        );

        console.log('✅ [Sales API] Inventory movements recorded via MovementService');
        console.log('✅ [Sales API] Movements created:', movements.length);
      } catch (movementError: any) {
        console.warn('⚠️ [Sales API] Error recording movements:', movementError);
        console.warn('⚠️ [Sales API] Error message:', movementError.message);
        console.warn('⚠️ [Sales API] Stack:', movementError.stack);
        // No fallar la creación de la venta por error en movimientos
      }
    } else {
      console.warn('⚠️ [Sales API] No items to process for inventory movements');
    }

    // Formatear respuesta para mantener compatibilidad
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

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Sales API] General error in POST:', error);
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: errorMessage, stack: errorStack },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }

    // Preparar datos para actualización
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

    // Actualizar en Supabase
    const { data: updatedSale, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando venta en Supabase:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la venta', detalles: error.message },
        { status: 500 }
      );
    }

    if (!updatedSale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    // Formatear respuesta
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
    console.error('❌ Error general actualizando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }

    // Eliminar de Supabase
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      console.error('❌ Error eliminando venta de Supabase:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la venta', detalles: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Venta eliminada exitosamente" });

  } catch (error: any) {
    console.error('❌ Error general eliminando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}