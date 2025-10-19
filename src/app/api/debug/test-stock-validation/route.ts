// src/app/api/debug/test-stock-validation/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MovementService } from '@/services/MovementService';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Stock Validation] Probando validación de consistencia de stock...');

    const storeId = 'store_clifp94l0000008l3b1z9f8j7';
    const productId = 'prod-1';
    const warehouseId = 'wh-1';

    // Validar consistencia del stock del producto
    const validation = await MovementService.validateProductStock(
      productId,
      warehouseId,
      storeId
    );

    console.log('🔍 [Test Stock Validation] Resultado de validación:', validation);

    // Obtener historial de movimientos del producto
    const movements = await MovementService.getProductMovements(
      productId,
      storeId
    );

    console.log('📊 [Test Stock Validation] Movimientos encontrados:', movements.length);

    // Calcular stock basado en movimientos
    let calculatedStock = 0;
    movements.forEach(movement => {
      calculatedStock += movement.quantity;
    });

    return NextResponse.json({
      success: true,
      message: 'Test de validación de stock completado',
      results: {
        productId,
        warehouseId,
        storeId,
        validation,
        movementHistory: {
          totalMovements: movements.length,
          calculatedStockFromMovements: calculatedStock,
          movementTypes: movements.reduce((acc, m) => {
            acc[m.movementType] = (acc[m.movementType] || 0) + 1;
            return acc;
          }, {}),
          recentMovements: movements.slice(0, 5).map(m => ({
            type: m.movementType,
            quantity: m.quantity,
            date: m.createdAt,
            reference: m.referenceId
          }))
        }
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Stock Validation] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de validación de stock',
        error: error.message
      },
      { status: 500 }
    );
  }
}