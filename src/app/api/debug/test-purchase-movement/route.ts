// src/app/api/debug/test-purchase-movement/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Purchase } from '@/models/Purchase';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Purchase Movement] Probando creación de compra con movimientos automáticos...');

    const testStoreId = 'test_purchase_movement_store';
    const testPurchaseId = `test_purchase_${Date.now()}`;
    const testProductId1 = 'prod-1'; // Usar producto existente
    const testProductId2 = 'prod-2'; // Usar producto existente

    // Limpiar datos de test anteriores
    await Purchase.deleteMany({ id: testPurchaseId });
    await InventoryMovement.deleteMany({ referenceId: testPurchaseId });

    // Crear compra de prueba con múltiples productos
    const purchaseData = {
      id: testPurchaseId,
      supplierId: 'sup-1',
      supplierName: 'Proveedor de Prueba',
      items: [
        {
          productId: testProductId1,
          productName: 'Tarjeta Gráfica RTX 4090',
          quantity: 5,
          cost: 1600.00
        },
        {
          productId: testProductId2,
          productName: 'Procesador Intel Core i9-13900K',
          quantity: 3,
          cost: 520.00
        }
      ],
      total: 9560.00, // (5 * 1600) + (3 * 520)
      date: new Date().toISOString(),
      documentNumber: 'TEST-PUR-001',
      responsible: 'test_user',
      storeId: testStoreId
    };

    console.log('📦 [Test Purchase Movement] Creando compra:', purchaseData.id);
    console.log('📦 [Test Purchase Movement] Productos:', purchaseData.items.length);

    // Llamar a la API de compras
    const createResponse = await fetch('http://localhost:3000/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });

    if (!createResponse.ok) {
      throw new Error(`Error creando compra: ${createResponse.status}`);
    }

    const createdPurchase = await createResponse.json();
    console.log('✅ [Test Purchase Movement] Compra creada:', createdPurchase.id);

    // Esperar un momento para que se procesen los movimientos
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verificar que se crearon los movimientos automáticamente
    const movements = await InventoryMovement.find({ 
      referenceId: testPurchaseId,
      referenceType: 'purchase_order'
    });

    console.log('🔍 [Test Purchase Movement] Movimientos encontrados:', movements.length);

    const movementsByProduct = {};
    movements.forEach(movement => {
      movementsByProduct[movement.productId] = movement;
    });

    return NextResponse.json({
      success: true,
      message: 'Test de creación de compra con movimientos completado',
      results: {
        purchaseCreated: !!createdPurchase,
        purchaseId: createdPurchase.id,
        itemsInPurchase: purchaseData.items.length,
        movementsFound: movements.length,
        movementsExpected: purchaseData.items.length,
        allMovementsCreated: movements.length === purchaseData.items.length,
        movementDetails: movements.map(m => ({
          id: m._id,
          productId: m.productId,
          movementType: m.movementType,
          quantity: m.quantity,
          unitCost: m.unitCost,
          totalValue: m.totalValue,
          referenceType: m.referenceType,
          referenceId: m.referenceId,
          batchId: m.batchId,
          notes: m.notes
        }))
      },
      testData: {
        purchaseId: testPurchaseId,
        storeId: testStoreId,
        products: [testProductId1, testProductId2]
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Purchase Movement] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de creación de compra',
        error: error.message
      },
      { status: 500 }
    );
  }
}