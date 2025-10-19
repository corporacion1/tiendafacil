// src/app/api/debug/test-purchase-fixed/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Purchase } from '@/models/Purchase';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Purchase Fixed] Probando compra con storeId correcto...');

    // Usar el storeId por defecto donde existen los productos
    const storeId = 'store_clifp94l0000008l3b1z9f8j7'; // defaultStoreId
    const testPurchaseId = `test_purchase_fixed_${Date.now()}`;

    // Verificar que los productos existen
    const product1 = await Product.findOne({ id: 'prod-1', storeId });
    const product2 = await Product.findOne({ id: 'prod-2', storeId });

    console.log('🔍 [Test Purchase Fixed] Producto 1 existe:', !!product1);
    console.log('🔍 [Test Purchase Fixed] Producto 2 existe:', !!product2);

    if (!product1 || !product2) {
      return NextResponse.json({
        success: false,
        message: 'Productos no encontrados en el store',
        productCheck: {
          product1Exists: !!product1,
          product2Exists: !!product2,
          storeId
        }
      });
    }

    // Limpiar datos de test anteriores
    await Purchase.deleteMany({ id: testPurchaseId });
    await InventoryMovement.deleteMany({ referenceId: testPurchaseId });

    // Crear compra de prueba
    const purchaseData = {
      id: testPurchaseId,
      supplierId: 'sup-1',
      supplierName: 'Proveedor de Prueba',
      items: [
        {
          productId: 'prod-1',
          productName: 'Tarjeta Gráfica RTX 4090',
          quantity: 2,
          cost: 1600.00
        },
        {
          productId: 'prod-2',
          productName: 'Procesador Intel Core i9-13900K',
          quantity: 1,
          cost: 520.00
        }
      ],
      total: 3720.00,
      date: new Date().toISOString(),
      documentNumber: 'TEST-PUR-FIXED-001',
      responsible: 'test_user',
      storeId: storeId
    };

    console.log('📦 [Test Purchase Fixed] Creando compra con storeId:', storeId);

    // Llamar a la API de compras
    const createResponse = await fetch('http://localhost:3000/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Error creando compra: ${createResponse.status} - ${errorText}`);
    }

    const createdPurchase = await createResponse.json();
    console.log('✅ [Test Purchase Fixed] Compra creada:', createdPurchase.id);

    // Esperar para que se procesen los movimientos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar movimientos
    const movements = await InventoryMovement.find({ 
      referenceId: testPurchaseId,
      referenceType: 'purchase_order'
    });

    console.log('🔍 [Test Purchase Fixed] Movimientos encontrados:', movements.length);

    return NextResponse.json({
      success: true,
      message: 'Test de compra con storeId correcto completado',
      results: {
        purchaseCreated: !!createdPurchase,
        purchaseId: createdPurchase.id,
        storeId: storeId,
        itemsInPurchase: purchaseData.items.length,
        movementsFound: movements.length,
        movementsExpected: purchaseData.items.length,
        allMovementsCreated: movements.length === purchaseData.items.length,
        productCheck: {
          product1Exists: !!product1,
          product2Exists: !!product2
        },
        movementDetails: movements.map(m => ({
          id: m._id,
          productId: m.productId,
          movementType: m.movementType,
          quantity: m.quantity,
          unitCost: m.unitCost,
          referenceId: m.referenceId,
          batchId: m.batchId
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Purchase Fixed] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de compra corregido',
        error: error.message
      },
      { status: 500 }
    );
  }
}