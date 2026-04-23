import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';
import { MovementService, MovementType, ReferenceType } from '@/services/MovementService';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { saleId, storeId, userId, notes } = data;

        if (!saleId || !storeId) {
            return NextResponse.json({ error: 'saleId y storeId son requeridos' }, { status: 400 });
        }

        console.log(`🔄 [Return API] Iniciando devolución de venta: ${saleId} para tienda: ${storeId}`);

        // 1. Obtener detalles de la venta
        const { data: sale, error: saleError } = await dbAdmin
            .from('sales')
            .select('*')
            .eq('id', saleId)
            .eq('store_id', storeId)
            .single();

        if (saleError || !sale) {
            console.error('❌ [Return API] Venta no encontrada:', saleError);
            return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
        }

        if (sale.status === 'returned') {
            return NextResponse.json({ error: 'Esta venta ya ha sido devuelta' }, { status: 400 });
        }

        // 2. Procesar la restitución de inventario PARA CADA ITEM
        const items = sale.items || [];
        console.log(`📦 [Return API] Restituyendo inventario para ${items.length} productos`);

        for (const item of items) {
            try {
                // Obtener datos actuales del producto para calcular stock y obtener warehouse
                const { data: product, error: pError } = await dbAdmin
                    .from('products')
                    .select('*')
                    .eq('id', item.productId)
                    .eq('store_id', storeId)
                    .single();

                if (pError || !product) {
                    console.warn(`⚠️ [Return API] Producto ${item.productId} no encontrado, saltando...`);
                    continue;
                }

                const quantityToRestore = Math.abs(item.quantity);
                const previousStock = product.stock || 0;
                const newStock = previousStock + quantityToRestore;

                console.log(`🏭 [Return API] Restaurando producto ${item.productId}: ${previousStock} -> ${newStock}`);

                // ACTUALIZACIÓN MANUAL DE STOCK PARA SEGURIDAD
                const { error: updateError } = await dbAdmin
                    .from('products')
                    .update({
                        stock: newStock,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', item.productId)
                    .eq('store_id', storeId);

                if (updateError) {
                    console.error(`❌ [Return API] Error actualizando stock de ${item.productId}:`, updateError);
                }

                // REGISTRO DE MOVIMIENTO DE DEVOLUCIÓN (NUEVO REGISTRO)
                // Usamos un reference_id diferente para que no sea borrado por la limpieza de la venta
                const movementData = {
                    id: `mov_ret_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    product_id: item.productId,
                    store_id: storeId,
                    warehouse_id: product.warehouse || 'main',
                    movement_type: 'return',
                    quantity: quantityToRestore,
                    previous_stock: previousStock,
                    new_stock: newStock,
                    reference_type: 'sale_return',
                    reference_id: saleId,
                    user_id: userId || 'system',
                    notes: `Devolución de venta ${saleId}. ${notes || ''}`,
                    unit_cost: product.cost || 0,
                    total_value: (product.cost || 0) * quantityToRestore,
                    product_name: product.name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: movInsertError } = await dbAdmin
                    .from('inventory_movements')
                    .insert(movementData);

                if (movInsertError) {
                    console.error(`❌ [Return API] Error insertando movimiento para ${item.productId}:`, movInsertError);
                }

            } catch (err: any) {
                console.error(`❌ [Return API] Error procesando item ${item.productId}:`, err.message);
            }
        }

        // 3. Eliminar movimientos de salida originales
        // Borramos los movimientos donde reference_id sea saleId y el tipo sea 'sale' (salida)
        const { error: deleteError } = await dbAdmin
            .from('inventory_movements')
            .delete()
            .eq('reference_id', saleId)
            .eq('movement_type', 'sale');

        if (deleteError) {
            console.error('── [Return API] Error eliminando movimientos originales:', deleteError);
        }

        // 4. Actualizar sesión de caja
        // Buscamos la sesión que contiene esta venta
        const { data: sessions, error: sessionsError } = await dbAdmin
            .from('cash_sessions')
            .select('*')
            .eq('store_id', storeId)
            .eq('status', 'open');

        if (!sessionsError && sessions) {
            for (const session of sessions) {
                const salesIds = session.sales_ids || [];
                if (salesIds.includes(saleId)) {
                    console.log(`💰 [Return API] Ajustando sesión de caja: ${session.id}`);

                    const payments = sale.payments || [];
                    const updatedTransactions = { ...(session.transactions || {}) };
                    let cashToSubtract = 0;

                    payments.forEach((p: any) => {
                        const method = p.method.toLowerCase();
                        // Restar el monto del método correspondiente
                        updatedTransactions[method] = (updatedTransactions[method] || 0) - p.amount;
                        if (method === 'efectivo' || method === 'cash') {
                            cashToSubtract += p.amount;
                        }
                    });

                    const updatedSalesIds = salesIds.filter((id: string) => id !== saleId);

                    const { error: sessionUpdateError } = await dbAdmin
                        .from('cash_sessions')
                        .update({
                            transactions: updatedTransactions,
                            sales_ids: updatedSalesIds,
                            total_cash: (session.total_cash || 0) - cashToSubtract
                        })
                        .eq('id', session.id)
                        .eq('store_id', storeId);

                    if (sessionUpdateError) {
                        console.error('❌ [Return API] Error actualizando totales de sesión:', sessionUpdateError);
                    }
                    break;
                }
            }
        }

        // 5. Eliminar cuentas por cobrar (créditos) asociadas
        await dbAdmin
            .from('account_receivables')
            .delete()
            .eq('sale_id', saleId)
            .eq('store_id', storeId);

        // 6. Marcar la venta como devuelta
        const { error: updateSaleError } = await dbAdmin
            .from('sales')
            .update({
                status: 'returned',
                total: 0,
                paid_amount: 0
            })
            .eq('id', saleId)
            .eq('store_id', storeId);

        if (updateSaleError) {
            console.error('❌ [Return API] Error finalizando devolución en tabla sales:', updateSaleError);
            return NextResponse.json({ error: 'No se pudo actualizar el estado de la venta' }, { status: 500 });
        }

        // 7. Revalidaciones de cache
        revalidateTag(`products-${storeId}`);
        revalidateTag('products');
        revalidateTag(`sales-${storeId}`);
        revalidateTag('sales');

        console.log(`✅ [Return API] Devolución completada existosamente para venta: ${saleId}`);

        return NextResponse.json({
            success: true,
            message: 'Venta devuelta correctamente. Inventario restituido manualmente y registro de devolución creado.'
        });

    } catch (error: any) {
        console.error('❌ [Return API] Error general:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
