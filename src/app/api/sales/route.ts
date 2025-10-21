import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Sale } from '@/models/Sale';
import { MovementService } from '@/services/MovementService';
import { MovementType, ReferenceType } from '@/models/InventoryMovement';
import { Product } from '@/models/Product';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    const sales = await Sale.find({ storeId }).lean();
    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la lista de ventas', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    if (!data.id || !data.storeId || !data.items) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }
    
    const created = await Sale.create(data);
    
    // 📦 NUEVO: Registrar movimientos de inventario para cada producto vendido
    if (created && data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Sales API] Registrando movimientos para venta:', created.id);
      console.log('📦 [Sales API] Productos en venta:', data.items.length);
      
      try {
        // Generar un batchId para agrupar todos los movimientos de esta venta
        const batchId = MovementService.generateBatchId();
        
        // Crear movimientos para cada producto (cantidades negativas para salidas)
        const movementPromises = data.items.map(async (item: any) => {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            console.warn('⚠️ [Sales API] Item inválido:', item);
            return null;
          }
          
          // Obtener información del producto para el almacén y costo
          let warehouseId = 'wh-1'; // Por defecto
          let unitCost = 0;
          
          try {
            const product = await Product.findOne({ 
              id: item.productId, 
              storeId: data.storeId 
            });
            
            if (product) {
              // Mapear nombre de almacén a ID si es necesario
              if (product.warehouse) {
                warehouseId = product.warehouse === 'Almacén Principal' ? 'wh-1' : 
                             product.warehouse === 'Depósito Secundario' ? 'wh-2' : 
                             'wh-1';
              }
              // Usar el costo del producto para valorizar la salida
              unitCost = product.cost || 0;
            }
          } catch (productError) {
            console.warn('⚠️ [Sales API] Error obteniendo producto:', productError);
          }
          
          return MovementService.recordMovement({
            productId: item.productId,
            warehouseId: warehouseId,
            movementType: MovementType.SALE,
            quantity: -Number(item.quantity), // NEGATIVO para salidas
            unitCost: unitCost,
            referenceType: ReferenceType.SALE_TRANSACTION,
            referenceId: created.id,
            batchId: batchId,
            userId: data.userId || data.soldBy || 'system',
            notes: `Venta a ${data.customerName || 'cliente'} - ${item.productName || item.productId}`,
            storeId: data.storeId
          });
        });
        
        // Ejecutar todos los movimientos
        const movements = await Promise.all(movementPromises);
        const successfulMovements = movements.filter(m => m !== null);
        
        console.log('✅ [Sales API] Movimientos registrados:', successfulMovements.length, 'de', data.items.length);
        
        // Opcional: Validar que hay suficiente stock antes de la venta
        // (esto se puede implementar como una validación adicional)
        
      } catch (movementError) {
        console.warn('⚠️ [Sales API] Error registrando movimientos:', movementError);
        // No fallar la creación de la venta por error en movimientos
        // En un sistema real, podrías querer revertir la venta si fallan los movimientos
      }
    }
    
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }
    
    const updated = await Sale.findOneAndUpdate(
      { id: data.id, storeId: data.storeId },
      { $set: data },
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');
    
    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }
    
    const deleted = await Sale.findOneAndDelete({ id, storeId });
    
    if (!deleted) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Venta eliminada exitosamente" });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
