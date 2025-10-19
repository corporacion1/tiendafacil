// src/app/api/debug/test-purchase-simple/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MovementService } from '@/services/MovementService';
import { MovementType, ReferenceType } from '@/models/InventoryMovement';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Purchase Simple] Probando registro directo de movimiento de compra...');

    // Test directo del MovementService
    const testMovement = await MovementService.recordMovement({
      productId: 'prod-1',
      warehouseId: 'wh-1',
      movementType: MovementType.PURCHASE,
      quantity: 10,
      unitCost: 1600.00,
      referenceType: ReferenceType.PURCHASE_ORDER,
      referenceId: 'test_direct_purchase',
      userId: 'test_user',
      notes: 'Test directo de movimiento de compra',
      storeId: 'test_store'
    });

    console.log('📦 [Test Purchase Simple] Resultado del movimiento:', testMovement ? 'Creado' : 'Falló');

    return NextResponse.json({
      success: true,
      message: 'Test simple de movimiento de compra completado',
      movementCreated: !!testMovement,
      movementId: testMovement?._id,
      movementDetails: testMovement ? {
        productId: testMovement.productId,
        quantity: testMovement.quantity,
        movementType: testMovement.movementType,
        referenceId: testMovement.referenceId
      } : null
    });

  } catch (error: any) {
    console.error('❌ [Test Purchase Simple] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test simple de compra',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}