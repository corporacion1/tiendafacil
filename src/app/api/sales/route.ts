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
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.storeId || !data.items) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Generar ID único si no se proporciona
    const saleId = data.id || generateId('SALE');
    
    // Preparar datos para Supabase
    const saleData = {
      id: saleId,
      customer_id: data.customerId || 'eventual',
      customer_name: data.customerName || 'Cliente Eventual',
      customer_phone: data.customerPhone,
      items: data.items,
      total: data.total,
      date: data.date || new Date().toISOString(),
      transaction_type: data.transactionType || 'contado',
      status: data.status || 'paid',
      paid_amount: data.paidAmount || 0,
      payments: (data.payments || []).map((payment: any) => ({
        ...payment,
        id: payment.id || generateId('PAY')
      })),
      store_id: data.storeId,
      credit_days: data.creditDays,
      credit_due_date: data.creditDueDate,
      user_id: data.userId || 'system'
    };

    console.log('💰 [Sales API] Creando venta en Supabase:', saleId);

    // Insertar venta en Supabase
    const { data: createdSale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (saleError) {
      console.error('❌ Error creando venta en Supabase:', saleError);
      return NextResponse.json(
        { error: 'Error al crear la venta', detalles: saleError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Sales API] Venta creada exitosamente:', saleId);

    // 📦 Registrar movimientos de inventario para cada producto vendido
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Sales API] Registrando movimientos para venta:', saleId);
      
      try {
        const batchId = generateId('BATCH');
        const movementPromises = data.items.map(async (item: any) => {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            console.warn('⚠️ [Sales API] Item inválido:', item);
            return null;
          }

          // Obtener información del producto para costo y almacén
          let warehouseId = 'wh-1'; // Por defecto
          let unitCost = 0;

          try {
            const { data: product } = await supabase
              .from('products')
              .select('cost, warehouse')
              .eq('id', item.productId)
              .eq('store_id', data.storeId)
              .single();

            if (product) {
              // Mapear nombre de almacén a ID
              if (product.warehouse) {
                warehouseId = product.warehouse === 'Almacén Principal' ? 'wh-1' : 
                             product.warehouse === 'Depósito Secundario' ? 'wh-2' : 'wh-1';
              }
              unitCost = product.cost || 0;
            }
          } catch (productError) {
            console.warn('⚠️ [Sales API] Error obteniendo producto:', productError);
          }

          // Crear movimiento de inventario
          const movementData = {
            id: generateId('MOV'),
            product_id: item.productId,
            warehouse_id: warehouseId,
            movement_type: 'sale',
            quantity: -Number(item.quantity), // NEGATIVO para salidas
            unit_cost: unitCost,
            total_value: unitCost * Number(item.quantity),
            reference_type: 'sale_transaction',
            reference_id: saleId,
            batch_id: batchId,
            user_id: data.userId || 'system',
            notes: `Venta a ${data.customerName || 'cliente'} - ${item.productName || item.productId}`,
            store_id: data.storeId,
            created_at: new Date().toISOString()
          };

          const { error: movementError } = await supabase
            .from('inventory_movements')
            .insert([movementData]);

          if (movementError) {
            console.error('❌ Error creando movimiento:', movementError);
            return null;
          }

          return movementData.id;
        });

        // Ejecutar todos los movimientos
        const movements = await Promise.all(movementPromises);
        const successfulMovements = movements.filter(m => m !== null);
        
        console.log('✅ [Sales API] Movimientos registrados:', successfulMovements.length, 'de', data.items.length);

      } catch (movementError) {
        console.warn('⚠️ [Sales API] Error registrando movimientos:', movementError);
        // No fallar la creación de la venta por error en movimientos
      }
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
    console.error('❌ Error general creando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
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