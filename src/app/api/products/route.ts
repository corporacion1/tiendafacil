import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, validateRequiredFields, logDatabaseOperation } from '@/lib/db-error-handler';
import { MovementService } from '@/services/MovementService';
import { MovementType, ReferenceType } from '@/models/InventoryMovement';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    logDatabaseOperation('GET', 'products', { storeId });
    const products = await Product.find({ storeId }).lean();
    
    return NextResponse.json(products);
  } catch (error) {
    return handleDatabaseError(error, 'GET products');
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Generar ID único si no se proporciona
    if (!data.id) {
      data.id = IDGenerator.generate('product');
    }
    
    const validationError = validateRequiredFields(data, ['name', 'storeId']);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    
    // 📦 CORREGIDO: Separar stock inicial para manejo correcto de inventario
    const initialStock = Number(data.stock) || 0;
    const productDataWithoutStock = { ...data };
    delete productDataWithoutStock.stock; // Remover stock de los datos iniciales
    
    logDatabaseOperation('POST', 'products', productDataWithoutStock);
    
    // Crear producto SIN stock inicial (será 0 por defecto)
    const created = await Product.create({
      ...productDataWithoutStock,
      stock: 0 // Siempre iniciar con stock 0
    });
    
    // 📦 Registrar movimiento inicial SOLO si hay stock inicial > 0
    if (created && initialStock > 0) {
      console.log('📦 [Products API] Registrando movimiento inicial para producto:', created.id, 'Stock:', initialStock);
      
      try {
        await MovementService.recordMovement({
          productId: created.id,
          warehouseId: data.warehouse || 'wh-1',
          movementType: MovementType.INITIAL_STOCK,
          quantity: initialStock,
          unitCost: data.cost ? Number(data.cost) : 0,
          referenceType: ReferenceType.PRODUCT_CREATION,
          referenceId: created.id,
          userId: data.userId || 'system',
          notes: `Stock inicial del producto: ${created.name} (Cantidad: ${initialStock})`,
          storeId: data.storeId
        });
        
        console.log('✅ [Products API] Movimiento inicial registrado exitosamente. Stock final:', initialStock);
      } catch (movementError) {
        console.warn('⚠️ [Products API] Error registrando movimiento inicial:', movementError);
        // No fallar la creación del producto por error en movimiento
      }
    } else if (created) {
      console.log('📦 [Products API] Producto creado sin stock inicial (stock = 0)');
    }
    
    return NextResponse.json(created);
  } catch (error) {
    return handleDatabaseError(error, 'POST products');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    console.log('📥 [Products API] PUT recibido:', { id: data.id, storeId: data.storeId });
    console.log('📦 [Products API] Datos completos:', data);
    
    const validationError = validateRequiredFields(data, ['id', 'storeId']);
    if (validationError) {
      console.error('❌ [Products API] Error de validación:', validationError);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    
    logDatabaseOperation('PUT', 'products', data);
    
    console.log('🔍 [Products API] Buscando producto:', { id: data.id, storeId: data.storeId });
    
    const updated = await Product.findOneAndUpdate(
      { id: data.id, storeId: data.storeId },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      console.error('❌ [Products API] Producto no encontrado en DB');
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    
    console.log('✅ [Products API] Producto actualizado exitosamente:', updated.id);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('❌ [Products API] Error en PUT:', error);
    return handleDatabaseError(error, 'PUT products');
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
    
    logDatabaseOperation('DELETE', 'products', { id, storeId });
    const deleted = await Product.findOneAndDelete({ id, storeId });
    
    if (!deleted) {
      return NextResponse.json({ error: "Producto no existe" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE products');
  }
}
