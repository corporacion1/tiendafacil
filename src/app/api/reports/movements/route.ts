// src/app/api/reports/movements/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
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
    const query: any = { storeId };
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (productId) query.productId = productId;
    if (movementType) query.movementType = movementType;

    // Obtener movimientos reales de la base de datos
    const movements = await InventoryMovement.find(query)
      .sort({ createdAt: -1 })
      .limit(1000) // Limitar para rendimiento
      .lean();

    console.log('📦 [Reports Movements API] Movimientos encontrados:', movements.length);

    // Enriquecer con información de productos
    const enrichedMovements = await Promise.all(
      movements.map(async (movement) => {
        try {
          const product = await Product.findOne({ 
            id: movement.productId, 
            storeId 
          });
          
          return {
            id: movement._id,
            productId: movement.productId,
            productName: product?.name || `Producto ${movement.productId}`,
            productSku: product?.sku || '',
            warehouseId: movement.warehouseId,
            movementType: movement.movementType,
            quantity: movement.quantity,
            unitCost: movement.unitCost,
            totalValue: movement.totalValue,
            referenceType: movement.referenceType,
            referenceId: movement.referenceId,
            batchId: movement.batchId,
            previousStock: movement.previousStock,
            newStock: movement.newStock,
            userId: movement.userId,
            notes: movement.notes,
            date: movement.createdAt,
            storeId: movement.storeId
          };
        } catch (productError) {
          console.warn('⚠️ [Reports Movements API] Error obteniendo producto:', productError);
          return {
            id: movement._id,
            productId: movement.productId,
            productName: `Producto ${movement.productId}`,
            productSku: '',
            warehouseId: movement.warehouseId,
            movementType: movement.movementType,
            quantity: movement.quantity,
            unitCost: movement.unitCost,
            totalValue: movement.totalValue,
            referenceType: movement.referenceType,
            referenceId: movement.referenceId,
            batchId: movement.batchId,
            previousStock: movement.previousStock,
            newStock: movement.newStock,
            userId: movement.userId,
            notes: movement.notes,
            date: movement.createdAt,
            storeId: movement.storeId
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
        from: movements.length > 0 ? movements[movements.length - 1].createdAt : null,
        to: movements.length > 0 ? movements[0].createdAt : null
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