// src/app/api/inventory/movements/route.ts
import { NextResponse } from 'next/server';
import { MovementService } from '@/services/MovementService';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/inventory/movements - Obtener movimientos con filtros
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const storeId = searchParams.get('storeId');
    const warehouseId = searchParams.get('warehouseId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const movementType = searchParams.get('movementType');
    const userId = searchParams.get('userId');
    const batchId = searchParams.get('batchId');

    if (!productId || !storeId) {
      return NextResponse.json(
        { error: 'productId y storeId son requeridos' },
        { status: 400 }
      );
    }

    // Construir filtros
    const filters: any = {};

    if (warehouseId) filters.warehouseId = warehouseId;
    if (userId) filters.userId = userId;
    if (batchId) filters.batchId = batchId;

    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    if (movementType) filters.movementTypes = [movementType];

    // Obtener movimientos
    const movements = await MovementService.getProductMovements(
      productId,
      storeId,
      filters
    );

    return NextResponse.json({
      success: true,
      movements,
      count: movements.length
    });

  } catch (error: any) {
    console.error('❌ [Movements API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/inventory/movements - Registrar movimiento manual
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      productId,
      warehouseId,
      movementType,
      quantity,
      unitCost,
      referenceType,
      referenceId,
      userId,
      notes,
      storeId
    } = data;

    // Validar campos requeridos
    if (!productId || !warehouseId || !movementType || !quantity || !referenceType || !referenceId || !userId || !storeId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Registrar movimiento
    const movement = await MovementService.recordMovement({
      productId,
      warehouseId,
      movementType,
      quantity: Number(quantity),
      unitCost: unitCost ? Number(unitCost) : undefined,
      referenceType,
      referenceId,
      userId,
      notes,
      storeId
    });

    if (!movement) {
      return NextResponse.json(
        { error: 'No se pudo registrar el movimiento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movement
    });

  } catch (error: any) {
    console.error('❌ [Movements API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/movements - Registrar ajuste de inventario
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const {
      productId,
      newStock,
      reason,
      userId,
      storeId,
      warehouseId = 'wh-1'
    } = data;

    // Validar campos requeridos
    if (!productId || newStock === undefined || !reason || !userId || !storeId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: productId, newStock, reason, userId, storeId' },
        { status: 400 }
      );
    }

    // Obtener producto actual para saber el stock anterior
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const currentStock = product.stock || 0;
    const newStockValue = Number(newStock);

    // Registrar ajuste
    // El servicio se encarga de actualizar el stock del producto
    const movement = await MovementService.recordInventoryAdjustment(
      productId,
      product.name,
      currentStock,
      newStockValue,
      reason,
      userId,
      storeId,
      warehouseId
    );

    return NextResponse.json({
      success: true,
      movement,
      previousStock: currentStock,
      newStock: newStockValue,
      adjustment: newStockValue - currentStock
    });

  } catch (error: any) {
    console.error('❌ [Movements API] Error en ajuste:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}