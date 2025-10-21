import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Purchase } from '@/models/Purchase';
import { MovementService } from '@/services/MovementService';
import { MovementType, ReferenceType } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    const purchases = await Purchase.find({ storeId }).lean();
    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.id || !data.storeId || !data.supplierId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }
    
    const created = await Purchase.create(data);
    
    // 📦 NUEVO: Registrar movimientos de inventario para cada producto comprado
    if (created && data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Purchases API] Registrando movimientos para compra:', created.id);
      console.log('📦 [Purchases API] Productos en compra:', data.items.length);
      
      try {
        // Generar un batchId para agrupar todos los movimientos de esta compra
        const batchId = MovementService.generateBatchId();
        
        // Crear movimientos para cada producto
        const movementPromises = data.items.map(async (item: any) => {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            console.warn('⚠️ [Purchases API] Item inválido:', item);
            return null;
          }
          
          // Obtener información del producto para el almacén
          let warehouseId = 'wh-1'; // Por defecto
          try {
            const product = await Product.findOne({ 
              id: item.productId, 
              storeId: data.storeId 
            });
            if (product && product.warehouse) {
              // Mapear nombre de almacén a ID si es necesario
              warehouseId = product.warehouse === 'Almacén Principal' ? 'wh-1' : 
                           product.warehouse === 'Depósito Secundario' ? 'wh-2' : 
                           'wh-1';
            }
          } catch (productError) {
            console.warn('⚠️ [Purchases API] Error obteniendo producto:', productError);
          }
          
          return MovementService.recordMovement({
            productId: item.productId,
            warehouseId: warehouseId,
            movementType: MovementType.PURCHASE,
            quantity: Number(item.quantity),
            unitCost: item.cost ? Number(item.cost) : 0,
            referenceType: ReferenceType.PURCHASE_ORDER,
            referenceId: created.id,
            batchId: batchId,
            userId: data.responsible || data.userId || 'system',
            notes: `Compra de ${data.supplierName || 'proveedor'} - ${item.productName || item.productId}`,
            storeId: data.storeId
          });
        });
        
        // Ejecutar todos los movimientos
        const movements = await Promise.all(movementPromises);
        const successfulMovements = movements.filter(m => m !== null);
        
        console.log('✅ [Purchases API] Movimientos registrados:', successfulMovements.length, 'de', data.items.length);
        
      } catch (movementError) {
        console.warn('⚠️ [Purchases API] Error registrando movimientos:', movementError);
        // No fallar la creación de la compra por error en movimientos
      }
    }
    
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }
    const updated = await Purchase.findOneAndUpdate(
      { id: data.id, storeId: data.storeId },
      { $set: data },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');
    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }
    const deleted = await Purchase.findOneAndDelete({ id, storeId });
    if (!deleted) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    return NextResponse.json({ message: "Compra eliminada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
