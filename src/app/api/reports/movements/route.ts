// src/app/api/reports/movements/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const productId = searchParams.get('productId');
    const movementType = searchParams.get('movementType');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    console.log('📊 [Reports Movements API] Obteniendo movimientos para storeId:', storeId);

    // Construir query
    let query = supabaseAdmin
      .from('inventory_movements')
      .select('*')
      .eq('store_id', storeId);

    if (dateFrom || dateTo) {
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
    }

    if (productId) query = query.eq('product_id', productId);
    if (movementType) query = query.eq('movement_type', movementType);

    // Obtener movimientos
    const { data: movements, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('❌ [Reports Movements API] Error fetching movements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📦 [Reports Movements API] Movimientos encontrados:', movements?.length || 0);

    // Enriquecer con información de productos
    const enrichedMovements = await Promise.all(
      (movements || []).map(async (movement: any) => {
        try {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('name, sku')
            .eq('id', movement.product_id)
            .eq('store_id', storeId)
            .single();

          return {
            id: movement.id,
            productId: movement.product_id,
            productName: product?.name || `Producto ${movement.product_id}`,
            productSku: product?.sku || '',
            warehouseId: movement.warehouse_id,
            movementType: movement.movement_type,
            quantity: movement.quantity,
            unitCost: movement.unit_cost,
            totalValue: movement.total_value,
            referenceType: 'movement', // Generic type since we use reference_type for ID
            referenceId: movement.reference_type, // User schema: reference_type holds the ID
            batchId: movement.batch_id,
            previousStock: movement.previous_stock,
            newStock: movement.new_stock,
            userId: movement.user_id,
            notes: movement.notes,
            date: movement.created_at,
            storeId: movement.store_id
          };
        } catch (productError) {
          console.warn('⚠️ [Reports Movements API] Error obteniendo producto:', productError);
          return {
            id: movement.id,
            productId: movement.product_id,
            productName: `Producto ${movement.product_id}`,
            productSku: '',
            warehouseId: movement.warehouse_id,
            movementType: movement.movement_type,
            quantity: movement.quantity,
            unitCost: movement.unit_cost,
            totalValue: movement.total_value,
            referenceType: 'movement',
            referenceId: movement.reference_type,
            batchId: movement.batch_id,
            previousStock: movement.previous_stock,
            newStock: movement.new_stock,
            userId: movement.user_id,
            notes: movement.notes,
            date: movement.created_at,
            storeId: movement.store_id
          };
        }
      })
    );

    // Estadísticas de movimientos
    const stats = {
      totalMovements: enrichedMovements.length,
      movementTypes: enrichedMovements.reduce((acc: any, m: any) => {
        acc[m.movementType] = (acc[m.movementType] || 0) + 1;
        return acc;
      }, {}),
      totalValue: enrichedMovements.reduce((acc, m) => acc + (m.totalValue || 0), 0),
      dateRange: {
        from: enrichedMovements.length > 0 ? enrichedMovements[enrichedMovements.length - 1].date : null,
        to: enrichedMovements.length > 0 ? enrichedMovements[0].date : null
      }
    };

    return NextResponse.json({
      success: true,
      movements: enrichedMovements,
      stats
    });

  } catch (error: any) {
    console.error('❌ [Reports Movements API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
