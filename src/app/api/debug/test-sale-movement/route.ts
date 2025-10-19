// src/app/api/debug/test-sale-movement/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Sale } from '@/models/Sale';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🧪 [Test Sale Movement] Probando creación de venta con movimientos automáticos...');

    // Usar el storeId por defecto donde existen los productos
    const storeId = 'store_clifp94l0000008l3b1z9f8j7'; // defaultStoreId
    const testSaleId = `test_sale_${Date.now()}`;

    // Verificar que los productos existen
    const product1 = await Product.findOne({ id: 'prod-1', storeId });
    const product3 = await Product.findOne({ id: 'prod-3', storeId });

    console.log('🔍 [Test Sale Movement] Producto 1 existe:', !!product1);
    console.log('🔍 [Test Sale Movement] Producto 3 existe:', !!product3);

    if (!product1 || !product3) {
      return NextResponse.json({
        success: false,
        message: 'Productos no encontrados en el store',
        productCheck: {
          product1Exists: !!product1,
          product3Exists: !!product3,
          storeId
        }
      });
    }

    // Limpiar datos de test anteriores
    await Sale.deleteMany({ id: testSaleId });
    await InventoryMovement.deleteMany({ referenceId: testSaleId });

    // Crear venta de prueba con múltiples productos
    const saleData = {
      id: testSaleId,
      customerId: 'cust-1',
      customerName: 'Cliente de Prueba',
      items: [
        {
          productId: 'prod-1',
          productName: 'Tarjeta Gráfica RTX 4090',
          quantity: 1,
          price: 1799.99
        },
        {
          productId: 'prod-3',
          productName: 'Memoria RAM 32GB DDR5',
          quantity: 2,
          price: 129.99
        }
      ],
      total: 2059.97, // 1799.99 + (2 * 129.99)
      date: new Date().toISOString(),
      transactionType: 'contado',
      status: 'paid',
      paidAmount: 2059.97,
      soldBy: 'test_user',
      storeId: storeId
    };

    console.log('📦 [Test Sale Movement] Creando venta:', saleData.id);
    console.log('📦 [Test Sale Movement] Productos:', saleData.items.length);

    // Llamar a la API de ventas
    const createResponse = await fetch('http://localhost:3000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Error creando venta: ${createResponse.status} - ${errorText}`);
    }

    const createdSale = await createResponse.json();
    console.log('✅ [Test Sale Movement] Venta creada:', createdSale.id);

    // Esperar para que se procesen los movimientos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar movimientos
    const movements = await InventoryMovement.find({ 
      referenceId: testSaleId,
      referenceType: 'sale_transaction'
    });

    console.log('🔍 [Test Sale Movement] Movimientos encontrados:', movements.length);

    // Verificar que las cantidades son negativas (salidas)
    const allQuantitiesNegative = movements.every(m => m.quantity < 0);

    return NextResponse.json({
      success: true,
      message: 'Test de creación de venta con movimientos completado',
      results: {
        saleCreated: !!createdSale,
        saleId: createdSale.id,
        storeId: storeId,
        itemsInSale: saleData.items.length,
        movementsFound: movements.length,
        movementsExpected: saleData.items.length,
        allMovementsCreated: movements.length === saleData.items.length,
        allQuantitiesNegative: allQuantitiesNegative,
        productCheck: {
          product1Exists: !!product1,
          product3Exists: !!product3
        },
        movementDetails: movements.map(m => ({
          id: m._id,
          productId: m.productId,
          movementType: m.movementType,
          quantity: m.quantity, // Debe ser negativo
          unitCost: m.unitCost,
          referenceId: m.referenceId,
          batchId: m.batchId,
          notes: m.notes
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ [Test Sale Movement] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en test de creación de venta',
        error: error.message
      },
      { status: 500 }
    );
  }
}