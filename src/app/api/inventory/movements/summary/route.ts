// src/app/api/inventory/movements/summary/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MovementService } from '@/services/MovementService';

// GET /api/inventory/movements/summary - Obtener resumen de movimientos
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const storeId = searchParams.get('storeId');
    const warehouseId = searchParams.get('warehouseId') || 'wh-1';

    if (!productId || !storeId) {
      return NextResponse.json(
        { error: 'productId y storeId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener resumen de movimientos
    const summary = await MovementService.getMovementSummary(
      productId,
      storeId,
      warehouseId
    );

    // Obtener validación de consistencia
    const validation = await MovementService.validateProductStock(
      productId,
      warehouseId,
      storeId
    );

    return NextResponse.json({
      success: true,
      summary,
      validation,
      productId,
      storeId,
      warehouseId
    });

  } catch (error: any) {
    console.error('❌ [Movements Summary API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}