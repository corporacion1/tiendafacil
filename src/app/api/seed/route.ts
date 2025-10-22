// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Solo inicializa Mongoose
import bcrypt from 'bcryptjs';
import {
  defaultStore, mockProducts, mockSales, mockPurchases, defaultUsers,
  mockOrders, mockCurrencyRates, defaultCustomers,
  defaultSuppliers, initialUnits, initialFamilies, initialWarehouses,
  mockAds, mockCashSessions, paymentMethods, businessCategories,
  mockInventoryMovements
} from '@/lib/data';
import { IDGenerator } from '@/lib/id-generator';

// Importa tus modelos Mongoose
import { Product } from '@/models/Product';
import { Sale } from '@/models/Sale';
import { Purchase } from '@/models/Purchase';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import Order from '@/models/Order';
import { CurrencyRate } from '@/models/CurrencyRate';
import { Customer } from '@/models/Customer';
import { Supplier } from '@/models/Supplier';
import { Unit } from '@/models/Unit';
import { Family } from '@/models/Family';
import { Warehouse } from '@/models/Warehouse';
import { Ad } from '@/models/Ad';
import { CashSession } from '@/models/CashSession';
import { PaymentMethod } from '@/models/PaymentMethod';
import { BusinessCategory } from '@/models/BusinessCategory';
import Settings from '@/models/Settings';
import { InventoryMovement } from '@/models/InventoryMovement';
import { AccountReceivable } from '@/models/AccountReceivable';
import { CreditsSyncService } from '@/lib/credits-sync';
import Security from '@/models/Security';

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    await connectToDatabase(); // Inicializa la conexión Mongoose

    console.log('🌱 [Seed] Iniciando seed completo para storeId:', storeId);

    // Limpieza por modelo - Solo datos de la tienda específica
    console.log('🧹 [Seed] Limpiando datos existentes para storeId:', storeId);
    
    const deleteResults = {
      stores: await Store.deleteMany({ storeId }),
      products: await Product.deleteMany({ storeId }),
      sales: await Sale.deleteMany({ storeId }),
      purchases: await Purchase.deleteMany({ storeId }),
      orders: await Order.deleteMany({ storeId }),
      currencyRates: await CurrencyRate.deleteMany({ storeId }),
      customers: await Customer.deleteMany({ storeId }),
      suppliers: await Supplier.deleteMany({ storeId }),
      units: await Unit.deleteMany({ storeId }),
      families: await Family.deleteMany({ storeId }),
      warehouses: await Warehouse.deleteMany({ storeId }),
      ads: { deletedCount: 0 }, // Los ads son globales, no se eliminan por tienda
      cashSessions: await CashSession.deleteMany({ storeId }),
      paymentMethods: await PaymentMethod.deleteMany({ storeId }),
      businessCategories: await BusinessCategory.deleteMany({ storeId }),
      inventoryMovements: await InventoryMovement.deleteMany({ storeId }),
      accountsReceivable: await AccountReceivable.deleteMany({ storeId }),
      security: await Security.deleteMany({ userId: { $in: defaultUsers.map(u => u.uid) } })
    };

    console.log('✅ [Seed] Datos eliminados:', {
      stores: deleteResults.stores.deletedCount,
      products: deleteResults.products.deletedCount,
      sales: deleteResults.sales.deletedCount,
      purchases: deleteResults.purchases.deletedCount,
      orders: deleteResults.orders.deletedCount,
      currencyRates: deleteResults.currencyRates.deletedCount,
      customers: deleteResults.customers.deletedCount,
      suppliers: deleteResults.suppliers.deletedCount,
      units: deleteResults.units.deletedCount,
      families: deleteResults.families.deletedCount,
      warehouses: deleteResults.warehouses.deletedCount,
      ads: deleteResults.ads.deletedCount,
      cashSessions: deleteResults.cashSessions.deletedCount,
      paymentMethods: deleteResults.paymentMethods.deletedCount,
      businessCategories: deleteResults.businessCategories.deletedCount,
      inventoryMovements: deleteResults.inventoryMovements.deletedCount,
      accountsReceivable: deleteResults.accountsReceivable.deletedCount,
      security: deleteResults.security.deletedCount
    });

    // Preparar usuarios (las contraseñas ya están hasheadas en data.ts)
    console.log('👥 [Seed] Preparando usuarios con contraseñas pre-hasheadas...');
    const usersWithHashedPasswords = defaultUsers.map(user => ({
      ...user,
      storeId
    }));
    
    console.log(`✅ [Seed] ${usersWithHashedPasswords.length} usuarios preparados (contraseñas ya hasheadas)`);

    // Inserción demo por modelo
    console.log('📦 [Seed] Insertando datos demo...');
    
    try {
      const storeResult = await Store.insertMany([{ ...defaultStore, storeId }]);
      console.log('✅ [Seed] Store insertado:', storeResult.length);
    } catch (error) {
      console.error('❌ [Seed] Error insertando Store:', error);
      throw error;
    }
    
    // Generar IDs únicos para productos usando IDGenerator
    console.log('🔑 [Seed] Generando IDs únicos para productos...');
    
    // Generar IDs únicos para productos usando IDGenerator
    console.log('🔑 [Seed] Generando IDs únicos para productos...');
    
    // Mapear productos con IDs únicos y crear un mapa de IDs antiguos a nuevos
    const productIdMap = new Map<string, string>();
    const productsToInsert = mockProducts.map(p => {
      const newId = IDGenerator.generate('prod', storeId);
      productIdMap.set(p.id, newId);
      console.log(`  📝 [Seed] Mapeando: ${p.id} → ${newId}`);
      return { ...p, id: newId, storeId };
    });
    
    // Actualizar referencias de productId en ventas
    console.log('🔄 [Seed] Actualizando referencias en ventas...');
    const saleIdMap = new Map<string, string>();
    const salesWithUpdatedRefs = mockSales.map(s => {
      const newSaleId = IDGenerator.generate('sale', storeId);
      saleIdMap.set(s.id, newSaleId);
      console.log(`  📝 [Seed] Mapeando sale: ${s.id} → ${newSaleId}`);
      
      return {
        ...s,
        id: newSaleId,
        storeId,
        items: s.items.map(item => {
          const newProductId = productIdMap.get(item.productId) || item.productId;
          if (!productIdMap.has(item.productId)) {
            console.warn(`  ⚠️ [Seed] ProductId no encontrado en mapa: ${item.productId}`);
          }
          return {
            ...item,
            productId: newProductId
          };
        }),
        // Generar IDs únicos para payments
        payments: s.payments ? s.payments.map(p => ({
          ...p,
          id: IDGenerator.generate('pay', storeId)
        })) : []
      };
    });
    
    // Actualizar referencias de productId en compras
    console.log('🔄 [Seed] Actualizando referencias en compras...');
    const purchaseIdMap = new Map<string, string>();
    const purchasesWithUpdatedRefs = mockPurchases.map(p => {
      const newPurchaseId = IDGenerator.generate('purchase', storeId);
      purchaseIdMap.set(p.id, newPurchaseId);
      console.log(`  📝 [Seed] Mapeando purchase: ${p.id} → ${newPurchaseId}`);
      
      return {
        ...p,
        id: newPurchaseId,
        storeId,
        items: p.items.map(item => {
          const newProductId = productIdMap.get(item.productId) || item.productId;
          if (!productIdMap.has(item.productId)) {
            console.warn(`  ⚠️ [Seed] ProductId no encontrado en mapa: ${item.productId}`);
          }
          return {
            ...item,
            productId: newProductId
          };
        })
      };
    });
    
    try {
      console.log('📦 [Seed] Insertando', productsToInsert.length, 'productos con IDs únicos...');
      const productResult = await Product.insertMany(productsToInsert);
      console.log('✅ [Seed] Productos insertados:', productResult.length);
      console.log('🗺️ [Seed] Mapa de IDs creado con', productIdMap.size, 'entradas');
      
      console.log('📦 [Seed] Insertando ventas con referencias actualizadas...');
      const salesResult = await Sale.insertMany(salesWithUpdatedRefs);
      console.log('✅ [Seed] Ventas insertadas:', salesResult.length);
      
      console.log('📦 [Seed] Insertando compras con referencias actualizadas...');
      const purchasesResult = await Purchase.insertMany(purchasesWithUpdatedRefs);
      console.log('✅ [Seed] Compras insertadas:', purchasesResult.length);
      
      // Actualizar referencias de productId en órdenes
      console.log('🔄 [Seed] Actualizando referencias en órdenes...');
      const ordersWithUpdatedRefs = mockOrders.map(o => {
        const newOrderId = IDGenerator.generate('order', storeId);
        return {
          ...o,
          orderId: newOrderId,
          storeId,
          items: o.items.map(item => {
            const newProductId = productIdMap.get(item.productId) || item.productId;
            if (!productIdMap.has(item.productId)) {
              console.warn(`  ⚠️ [Seed] ProductId no encontrado en mapa para orden: ${item.productId}`);
            }
            return {
              ...item,
              productId: newProductId
            };
          })
        };
      });
      
      console.log('📦 [Seed] Insertando órdenes con referencias actualizadas...');
      await Order.insertMany(ordersWithUpdatedRefs);
      console.log('✅ [Seed] Órdenes insertadas con referencias actualizadas');
      
      // Actualizar referencias de productId en movimientos de inventario
      console.log('🔄 [Seed] Actualizando referencias en movimientos de inventario...');
      const movementsWithUpdatedRefs = mockInventoryMovements.map(m => {
        const newMovementId = IDGenerator.generate('mov', storeId);
        const newProductId = productIdMap.get(m.productId) || m.productId;
        
        // Actualizar referenceId según el tipo
        let newReferenceId = m.referenceId;
        if (m.referenceType === 'sale_transaction' && saleIdMap.has(m.referenceId)) {
          newReferenceId = saleIdMap.get(m.referenceId) || m.referenceId;
        } else if (m.referenceType === 'purchase_order' && purchaseIdMap.has(m.referenceId)) {
          newReferenceId = purchaseIdMap.get(m.referenceId) || m.referenceId;
        } else if (m.referenceType === 'manual_adjustment') {
          newReferenceId = IDGenerator.generate('adj', storeId);
        }
        
        if (!productIdMap.has(m.productId)) {
          console.warn(`  ⚠️ [Seed] ProductId no encontrado en mapa para movimiento: ${m.productId}`);
        }
        
        return {
          ...m,
          id: newMovementId,
          productId: newProductId,
          referenceId: newReferenceId,
          storeId
        };
      });
      
      console.log('📦 [Seed] Insertando movimientos de inventario con referencias actualizadas...');
      await InventoryMovement.insertMany(movementsWithUpdatedRefs);
      console.log('✅ [Seed] Movimientos de inventario insertados con referencias actualizadas');
      
    } catch (error: any) {
      console.error('❌ [Seed] Error insertando datos:', error.message);
      throw error;
    }
    
    // Insertar usuarios (usando upsert para evitar duplicados)
    console.log('👥 [Seed] Insertando/actualizando usuarios...');
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
    if (!db) throw new Error('Database connection not established');
    const usersCollection = db.collection('users');
    
    const userInsertResults = [];
    
    for (const user of usersWithHashedPasswords) {
      try {
        const result = await usersCollection.replaceOne(
          { email: user.email },
          user,
          { upsert: true }
        );
        
        console.log(`✅ [Seed] Usuario procesado: ${user.email} (${result.upsertedCount > 0 ? 'creado' : 'actualizado'})`);
        userInsertResults.push({
          email: user.email,
          success: true,
          action: result.upsertedCount > 0 ? 'created' : 'updated'
        });
      } catch (userError: any) {
        console.error(`❌ [Seed] Error con usuario ${user.email}:`, userError);
        userInsertResults.push({
          email: user.email,
          success: false,
          error: userError.message
        });
      }
    }
    
    const successfulUsers = userInsertResults.filter(r => r.success).length;
    console.log(`✅ [Seed] ${successfulUsers}/${usersWithHashedPasswords.length} usuarios procesados exitosamente`);
    
    // Insertar datos adicionales con IDs únicos
    console.log('📦 [Seed] Insertando datos adicionales con IDs únicos...');
    
    await CurrencyRate.insertMany(mockCurrencyRates.map(r => ({ 
      ...r, 
      id: IDGenerator.generate('rate', storeId),
      storeId 
    })));
    console.log('✅ [Seed] CurrencyRates con IDs únicos');
    
    await Customer.insertMany(defaultCustomers.map(c => ({ 
      ...c, 
      id: IDGenerator.generate('cust', storeId),
      storeId 
    })));
    console.log('✅ [Seed] Customers con IDs únicos');
    
    await Supplier.insertMany(defaultSuppliers.map(s => ({ 
      ...s, 
      id: IDGenerator.generate('sup', storeId),
      storeId 
    })));
    console.log('✅ [Seed] Suppliers con IDs únicos');
    
    await Unit.insertMany(initialUnits.map(u => ({ 
      ...u, 
      id: IDGenerator.generate('unit', storeId),
      storeId 
    })));
    console.log('✅ [Seed] Units con IDs únicos');
    
    await Family.insertMany(initialFamilies.map(f => ({ 
      ...f, 
      id: IDGenerator.generate('fam', storeId),
      storeId 
    })));
    console.log('✅ [Seed] Families con IDs únicos');
    
    await Warehouse.insertMany(initialWarehouses.map(w => ({ 
      ...w, 
      id: IDGenerator.generate('wh', storeId),
      storeId 
    })));
    console.log('✅ [Seed] Warehouses con IDs únicos');
    
    // Los Ads son globales, no se insertan por tienda
    // Usar /api/seed-ads para cargar ads globalmente
    console.log('✅ [Seed] Ads omitidos (son globales)');
    
    await CashSession.insertMany(mockCashSessions.map(s => ({ 
      ...s, 
      id: IDGenerator.generate('ses', storeId),
      storeId,
      // Actualizar salesIds con las nuevas referencias
      salesIds: s.salesIds ? s.salesIds.map(saleId => saleIdMap.get(saleId) || saleId) : []
    })));
    console.log('✅ [Seed] CashSessions con IDs únicos y referencias actualizadas');
    
    await PaymentMethod.insertMany(paymentMethods.map(m => ({ 
      ...m, 
      id: IDGenerator.generate('pm', storeId),
      storeId 
    })));
    console.log('✅ [Seed] PaymentMethods con IDs únicos');
    
    await BusinessCategory.insertMany(businessCategories.map(b => ({ 
      id: IDGenerator.generate('cat', storeId),
      name: b, 
      storeId 
    })));
    console.log('✅ [Seed] BusinessCategories con IDs únicos');
    
    console.log('🎉 [Seed] TODAS las entidades ahora tienen IDs únicos!');

    console.log('🔄 [Seed] Creando cuentas por cobrar automáticamente desde ventas a crédito...');
    
    // Crear cuentas por cobrar automáticamente desde las ventas a crédito (usando salesWithUpdatedRefs)
    let createdAccounts = 0;
    try {
      const creditSales = salesWithUpdatedRefs.filter(s => s.transactionType === 'credito');
      console.log(`📊 [Seed] Encontradas ${creditSales.length} ventas a crédito para procesar`);
      
      for (const sale of creditSales) {
        try {
          // Crear cuenta por cobrar directamente sin usar el servicio
          const saleDate = new Date(sale.date);
          const dueDate = new Date(saleDate);
          dueDate.setDate(dueDate.getDate() + 30); // 30 días de crédito por defecto
          
          // El customerId ya está actualizado en salesWithUpdatedRefs
          const accountData = {
            id: IDGenerator.generate('ar', storeId),
            saleId: sale.id,
            customerId: sale.customerId, // Ya tiene el nuevo ID
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            storeId: sale.storeId,
            originalAmount: sale.total,
            paidAmount: sale.paidAmount || 0,
            remainingBalance: sale.total - (sale.paidAmount || 0),
            saleDate,
            dueDate,
            creditDays: 30,
            status: (sale.paidAmount || 0) >= sale.total ? 'paid' : 
                    (sale.paidAmount || 0) > 0 ? 'partial' : 
                    new Date() > dueDate ? 'overdue' : 'pending',
            payments: sale.payments ? sale.payments.map((p: any) => ({
              id: p.id,
              amount: p.amount,
              paymentMethod: p.method,
              reference: p.reference,
              type: 'payment',
              processedBy: p.receivedBy,
              processedAt: new Date(p.date)
            })) : [],
            createdBy: 'seed_auto',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await AccountReceivable.create(accountData);
          console.log(`✅ [Seed] Cuenta creada: ${sale.id} -> ${accountData.id}`);
          createdAccounts++;
        } catch (error: any) {
          console.warn(`⚠️ [Seed] Error creando cuenta para ${sale.id}:`, error.message);
        }
      }
      
      console.log(`✅ [Seed] ${createdAccounts}/${creditSales.length} cuentas por cobrar creadas automáticamente`);
      
    } catch (syncError: any) {
      console.warn('⚠️ [Seed] Error en creación automática de cuentas:', syncError.message);
    }

    // Crear PINs de seguridad para usuarios demo
    console.log('🔐 [Seed] Creando PINs de seguridad para usuarios demo...');
    const defaultPins = [
      { userId: '5QLaiiIr4mcGsjRXVGeGx50nrpk1', pin: '1234' }, // Super usuario
      { userId: 'admin_demo_001', pin: '1234' }, // Admin
      { userId: 'seller_demo_001', pin: '1234' }, // Seller
      { userId: 'depositary_demo_001', pin: '1234' }, // Depositary
      { userId: 'user_demo_001', pin: '1234' }, // User
    ];

    let createdPins = 0;
    for (const pinData of defaultPins) {
      try {
        // Crear PIN (el modelo se encarga del hasheo automáticamente)
        await Security.create({
          userId: pinData.userId,
          pin: pinData.pin, // Sin hashear, el modelo lo hace automáticamente
          attempts: 0,
          lockedUntil: null,
          lastChanged: new Date()
        });
        createdPins++;
        console.log(`✅ [Seed] PIN creado para usuario: ${pinData.userId}`);
      } catch (pinError: any) {
        console.warn(`⚠️ [Seed] Error creando PIN para ${pinData.userId}:`, pinError.message);
      }
    }
    
    console.log(`✅ [Seed] ${createdPins}/${defaultPins.length} PINs de seguridad creados`);

    console.log('🎉 [Seed] Seed completo exitoso!');

    // Verificar usuarios creados usando MongoDB directo
    const createdUsers = await usersCollection.find({ storeId }).toArray();
    
    // Mapear contraseñas originales (no los hashes)
    const passwordMap = {
      'corporacion1@gmail.com': '19a1e3ef',
      'admin@tiendafacil.com': 'admin1234',
      'pos@tiendafacil.com': 'seller1234',
      'depositary@tiendafacil.com': 'depositary1234',
      'demo@tiendafacil.com': 'user1234'
    };
    
    const userCredentials = createdUsers.map((user: any) => ({
      email: user.email,
      password: passwordMap[user.email as keyof typeof passwordMap] || 'N/A',
      role: user.role,
      hasPassword: !!user.password
    }));

    return NextResponse.json({
      success: true,
      message: 'Siembra DEMO completada con IDs únicos!',
      storeId,
      userCredentials,
      userInsertResults,
      stats: {
        users: createdUsers.length,
        usersWithPassword: createdUsers.filter(u => !!u.password).length,
        products: mockProducts.length,
        sales: mockSales.length,
        customers: defaultCustomers.length,
        inventoryMovements: mockInventoryMovements.length,
        accountsReceivable: createdAccounts || 0,
        securityPins: createdPins || 0
      }
    });
  } catch (err: any) {
    console.error('❌ [Seed] Error en seed:', err);
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
