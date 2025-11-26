import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { Sale } from '@/models/Sale';
import { Purchase } from '@/models/Purchase';
import Order from '@/models/Order';
import { CurrencyRate } from '@/models/CurrencyRate';
import { Customer } from '@/models/Customer';
import { Supplier } from '@/models/Supplier';
import { Ad } from '@/models/Ad';
import { CashSession } from '@/models/CashSession';
import { InventoryMovement } from '@/models/InventoryMovement';
import { AccountReceivable } from '@/models/AccountReceivable';

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    await connectToDatabase();

    console.log('🏭 [Production API] Iniciando proceso de pasar a producción para storeId:', storeId);

    if (!storeId) {
      return NextResponse.json(
        { error: "StoreId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la tienda existe
    const store = await Store.findOne({ storeId });
    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no esté ya en producción
    if (store.status === 'inProduction') {
      return NextResponse.json(
        { error: "La tienda ya está en producción" },
        { status: 400 }
      );
    }

    console.log('🧹 [Production API] Limpiando datos demo para storeId:', storeId);
    
    // Limpiar SOLO datos demo, mantener configuración y usuarios
    await Product.deleteMany({ storeId });
    await Sale.deleteMany({ storeId });
    await Purchase.deleteMany({ storeId });
    await Order.deleteMany({ storeId });
    await CurrencyRate.deleteMany({ storeId });
    await Customer.deleteMany({ storeId });
    await Supplier.deleteMany({ storeId });
    await Ad.deleteMany({ storeId }); // Solo si son específicos de la tienda
    await CashSession.deleteMany({ storeId });
    await InventoryMovement.deleteMany({ storeId });
    await AccountReceivable.deleteMany({ storeId });

    console.log('✅ [Production API] Datos demo eliminados');

    // Actualizar el estado de la tienda a producción
    const updatedStore = await Store.findOneAndUpdate(
      { storeId },
      { 
        $set: { 
          status: 'inProduction',
          useDemoData: false,
          productionDate: new Date()
        }
      },
      { new: true }
    );

    console.log('🚀 [Production API] Tienda marcada como en producción:', updatedStore.name);

    return NextResponse.json({
      success: true,
      message: 'Tienda pasada a producción exitosamente',
      store: updatedStore,
      stats: {
        storeId,
        status: 'inProduction',
        cleanedData: [
          'products', 'sales', 'purchases', 'orders',
          'currencyRates', 'customers', 'suppliers', 'ads',
          'cashSessions', 'inventoryMovements', 'accountsReceivable'
        ],
        preservedData: ['store_settings', 'users', 'security_pins']
      }
    });

  } catch (err: any) {
    console.error('❌ [Production API] Error:', err);
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}