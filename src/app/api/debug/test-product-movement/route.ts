// src/app/api/debug/test-product-movement/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { InventoryMovement } from '@/models/InventoryMovement';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Product Movement] Probando creación de producto con movimiento automático...');

    const testStoreId = 'test_product_movement_store';
    const testProductId = `test_product_${Date.now()}`;

    // Limpiar datos de test anteriores
    await Product.deleteMany({ id: testProductId });
    await InventoryMovement.deleteMany({ productId: testProductId });

    // Crear producto de prueba con stock inicial
    const productData = {
      id: testProductId,
      name: 'Producto de Prueba para Movimientos',
      sku: 'TEST-PROD-001',
      stock: 25,
      price: 100.00,
      cost: 75.00,
      status: 'active',
      warehouse: 'wh-1',
      storeId: testStoreId,
      userId: 'test_user'
    };

    console.log('📦 [Test Product Movement] Creando producto:', productData.name);

    // Llamar a la API de productos
    const createResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!createResponse.ok) {
      throw new Error(`Error creando producto: ${createResponse.status}`);
    }

    const createdProduct = await createResponse.json();
    console.log('✅ [Test Product Movement] Producto creado:', createdProduct.id);

    // Esperar un momento para que se procese el movimiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que se creó el movimiento automáticamente
    const movements = await InventoryMovement.find({ 
      productId: testProductId,
      storeId: testStoreId 
    });

    console.log('🔍 [Test Product Movement] Movimientos encontrados:', movements.length);

    const initialMovement = movements.find(m => m.movementType === 'initial_stock');

    return NextResponse.json({
      success: true,
      message: 'Test de creación de producto con movimiento completado',
      results: {
        productCreated: !!createdProduct,
        productId: createdProduct.id,
        productStock: createdProduct.stock,
        movementsFound: movements.length,
        initialMovementCreated: !!initialMovement,
        movementDetails: initialMovement ? {
          id: initialMovement._id,
          movementType: initialMovement.movementType,
          quantity: initialMovement.quantity,
          unitCost: initialMovement.unitCost,
          referenceType: initialMovement.referenceType,
          referenceId: initialMovement.referenceId,
          previousStock: initialMovement.previousStock,
          newStock: initialMovement.newStock,
          notes: initialMovement.notes
        } : null
      },
      testData: {
        productId: testProductId,
        storeId: testStoreId
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Product Movement] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de creación de producto',
        error: error.message
      },
      { status: 500 }
    );
  }
}