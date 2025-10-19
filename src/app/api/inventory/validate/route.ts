// src/app/api/inventory/validate/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MovementService } from '@/services/MovementService';

// GET /api/inventory/validate - Validar consistencia de inventario
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const storeId = searchParams.get('storeId');

    if (!productId || !warehouseId || !storeId) {
      return NextResponse.json(
        { error: 'productId, warehouseId y storeId son requeridos' },
        { status: 400 }
      );
    }

    // Validar consistencia
    const validation = await MovementService.validateProductStock(
      productId,
      warehouseId,
      storeId
    );

    return NextResponse.json({
      success: true,
      validation
    });

  } catch (error: any) {
    console.error('❌ [Inventory Validate API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}