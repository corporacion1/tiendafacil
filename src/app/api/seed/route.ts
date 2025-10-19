// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Solo inicializa Mongoose
import bcrypt from 'bcryptjs';
import {
  defaultStore, mockProducts, mockSales, mockPurchases, defaultUsers,
  pendingOrdersState, mockCurrencyRates, defaultCustomers,
  defaultSuppliers, initialUnits, initialFamilies, initialWarehouses,
  mockAds, mockCashSessions, paymentMethods, businessCategories,
  mockInventoryMovements
} from '@/lib/data';

// Importa tus modelos Mongoose
import { Product } from '@/models/Product';
import { Sale } from '@/models/Sale';
import { Purchase } from '@/models/Purchase';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { PendingOrder } from '@/models/PendingOrder';
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
    
    await Store.deleteMany({ storeId });
    await Product.deleteMany({ storeId });
    await Sale.deleteMany({ storeId });
    await Purchase.deleteMany({ storeId });
    // NO eliminar usuarios aquí - los manejaremos con upsert
    await PendingOrder.deleteMany({ storeId });
    await CurrencyRate.deleteMany({ storeId });
    await Customer.deleteMany({ storeId });
    await Supplier.deleteMany({ storeId });
    await Unit.deleteMany({ storeId });
    await Family.deleteMany({ storeId });
    await Warehouse.deleteMany({ storeId });
    await Ad.deleteMany({ storeId });
    await CashSession.deleteMany({ storeId });
    await PaymentMethod.deleteMany({ storeId });
    await BusinessCategory.deleteMany({ storeId });
    await InventoryMovement.deleteMany({ storeId });
    await AccountReceivable.deleteMany({ storeId });
    // Limpiar PINs de seguridad de usuarios de esta tienda
    await Security.deleteMany({ userId: { $in: defaultUsers.map(u => u.uid) } });

    console.log('✅ [Seed] Datos existentes eliminados');

    // Preparar usuarios (las contraseñas ya están hasheadas en data.ts)
    console.log('👥 [Seed] Preparando usuarios con contraseñas pre-hasheadas...');
    const usersWithHashedPasswords = defaultUsers.map(user => ({
      ...user,
      storeId
    }));
    
    console.log(`✅ [Seed] ${usersWithHashedPasswords.length} usuarios preparados (contraseñas ya hasheadas)`);

    // Inserción demo por modelo
    console.log('📦 [Seed] Insertando datos demo...');
    await Store.insertMany([{ ...defaultStore, storeId }]);
    await Product.insertMany(mockProducts.map(p => ({ ...p, storeId })));
    await Sale.insertMany(mockSales.map(s => ({ ...s, storeId })));
    await Purchase.insertMany(mockPurchases.map(p => ({ ...p, storeId })));
    
    // Insertar usuarios (usando upsert para evitar duplicados)
    console.log('👥 [Seed] Insertando/actualizando usuarios...');
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
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
      } catch (userError) {
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
    
    await PendingOrder.insertMany(pendingOrdersState.map(o => ({ ...o, storeId })));
    await CurrencyRate.insertMany(mockCurrencyRates.map(r => ({ ...r, storeId })));
    await Customer.insertMany(defaultCustomers.map(c => ({ ...c, storeId })));
    await Supplier.insertMany(defaultSuppliers.map(s => ({ ...s, storeId })));
    await Unit.insertMany(initialUnits.map(u => ({ ...u, storeId })));
    await Family.insertMany(initialFamilies.map(f => ({ ...f, storeId })));
    await Warehouse.insertMany(initialWarehouses.map(w => ({ ...w, storeId })));
    await Ad.insertMany(mockAds); // Los ads no necesitan storeId, usan targetBusinessTypes
    await CashSession.insertMany(mockCashSessions.map(s => ({ ...s, storeId })));
    await PaymentMethod.insertMany(paymentMethods.map(m => ({ ...m, storeId })));
    await BusinessCategory.insertMany(businessCategories.map(b => ({ name: b, storeId })));
    await InventoryMovement.insertMany(mockInventoryMovements.map(m => ({ ...m, storeId })));

    console.log('🔄 [Seed] Creando cuentas por cobrar automáticamente desde ventas a crédito...');
    
    // Crear cuentas por cobrar automáticamente desde las ventas a crédito
    let createdAccounts = 0;
    try {
      const creditSales = mockSales.filter(s => s.transactionType === 'credito');
      console.log(`📊 [Seed] Encontradas ${creditSales.length} ventas a crédito para procesar`);
      
      for (const sale of creditSales) {
        try {
          // Crear cuenta por cobrar directamente sin usar el servicio
          const saleDate = new Date(sale.date);
          const dueDate = new Date(saleDate);
          dueDate.setDate(dueDate.getDate() + 30); // 30 días de crédito por defecto
          
          const accountData = {
            id: `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            saleId: sale.id,
            customerId: sale.customerId,
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
        // Crear PIN hasheado
        const hashedPin = await bcrypt.hash(pinData.pin, 12);
        await Security.create({
          userId: pinData.userId,
          pin: hashedPin,
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
    
    const userCredentials = createdUsers.map(user => ({
      email: user.email,
      password: passwordMap[user.email] || 'N/A',
      role: user.role,
      hasPassword: !!user.password
    }));

    return NextResponse.json({
      success: true,
      message: 'Siembra DEMO completada con contraseñas hasheadas!',
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
