// src/app/api/debug/migrate-now/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function POST() {
  try {
    console.log('🚀 [Migrate Now] Iniciando migración completa...');
    
    await connectToDatabase();
    console.log('🔌 [Migrate Now] Conectado a MongoDB');

    // 1. First, create default store if it doesn't exist
    const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';
    let store = await Store.findOne({ storeId: defaultStoreId });
    
    if (!store) {
      console.log('🏪 [Migrate Now] Creando tienda por defecto...');
      const defaultStore = {
        storeId: defaultStoreId,
        name: 'TiendaFácil Demo',
        ownerIds: ['user_demo_001'],
        userRoles: [{ uid: 'user_demo_001', role: 'admin' }],
        address: 'Dirección de ejemplo',
        businessType: 'retail',
        phone: '+1234567890',
        slogan: 'Tu tienda fácil y rápida',
        logoUrl: '/tienda_facil_logo.svg',
        primaryCurrencyName: 'Peso Dominicano',
        primaryCurrencySymbol: 'RD$',
        secondaryCurrencyName: 'Dólar Americano',
        secondaryCurrencySymbol: 'US$',
        saleSeries: 'B01',
        saleCorrelative: 1,
        tax1: 18,
        tax2: 0,
        whatsapp: '+1234567890',
        useDemoData: true
      };
      
      store = await Store.create(defaultStore);
      console.log('✅ [Migrate Now] Tienda creada:', store.name);
    } else {
      console.log('✅ [Migrate Now] Tienda ya existe:', store.name);
    }

    // 2. Create demo user if it doesn't exist
    const demoEmail = 'demo@tiendafacil.com';
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      console.log('👤 [Migrate Now] Creando usuario demo...');
      const hashedPassword = await bcrypt.hash('user1234', SALT_ROUNDS);
      
      demoUser = await User.create({
        uid: 'user_demo_001',
        email: demoEmail,
        password: hashedPassword,
        displayName: 'Usuario Demo',
        photoURL: '/tienda_facil_logo.svg',
        phone: '+1234567890',
        role: 'admin',
        status: 'active',
        storeId: defaultStoreId,
        storeRequest: false
      });
      
      console.log('✅ [Migrate Now] Usuario demo creado:', demoUser.email);
    } else {
      // Update existing user with password if missing
      if (!demoUser.password) {
        console.log('🔒 [Migrate Now] Agregando contraseña a usuario demo...');
        const hashedPassword = await bcrypt.hash('user1234', SALT_ROUNDS);
        await User.findByIdAndUpdate(demoUser._id, { password: hashedPassword });
        console.log('✅ [Migrate Now] Contraseña agregada al usuario demo');
      } else {
        console.log('✅ [Migrate Now] Usuario demo ya tiene contraseña');
      }
    }

    // 3. Update ALL users to ensure they have passwords
    const allUsers = await User.find({});
    console.log(`📊 [Migrate Now] Procesando ${allUsers.length} usuarios...`);

    for (const user of allUsers) {
      let needsUpdate = false;
      let password = user.password;
      
      // Check if user needs password
      if (!password || password === '' || password === null) {
        needsUpdate = true;
        
        // Use specific password for demo user, default for others
        const plainPassword = user.email === 'demo@tiendafacil.com' ? 'user1234' : 'tiendafacil123';
        password = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        
        console.log(`🔒 [Migrate Now] Agregando contraseña a: ${user.email}`);
      } else {
        console.log(`✅ [Migrate Now] Usuario ya tiene contraseña: ${user.email}`);
      }
      
      // Force update to ensure schema compliance
      const updateData = {
        uid: user.uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        password: password,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '/tienda_facil_logo.svg',
        role: user.role || 'user',
        status: user.status || 'active',
        storeId: user.storeId || defaultStoreId,
        storeRequest: user.storeRequest || false,
        phone: user.phone || null
      };
      
      await User.findByIdAndUpdate(user._id, updateData, { 
        new: true, 
        runValidators: true 
      });
      
      console.log(`✅ [Migrate Now] Usuario actualizado: ${user.email}`);
    }

    // 4. Final verification
    const totalUsers = await User.countDocuments({});
    const usersWithPassword = await User.countDocuments({ 
      password: { $exists: true, $ne: null, $ne: '' } 
    });

    const summary = {
      storeCreated: !store || store.isNew,
      totalUsers,
      usersWithPassword,
      usersUpdated: usersWithoutPassword.length,
      demoUserReady: true
    };

    console.log('📋 [Migrate Now] Resumen final:', summary);

    return NextResponse.json({
      success: true,
      message: 'Migración completa exitosa',
      summary,
      credentials: {
        email: 'demo@tiendafacil.com',
        password: 'user1234'
      }
    });

  } catch (error: any) {
    console.error('❌ [Migrate Now] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en migración',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    const totalUsers = await User.countDocuments({});
    const usersWithPassword = await User.countDocuments({ 
      password: { $exists: true, $ne: null, $ne: '' } 
    });
    const stores = await Store.countDocuments({});
    
    // Get sample users (without passwords for security)
    const sampleUsers = await User.find({}, { password: 0 }).limit(5);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersWithPassword,
        usersWithoutPassword: totalUsers - usersWithPassword,
        totalStores: stores
      },
      sampleUsers: sampleUsers.map(user => ({
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        hasPassword: !!user.password
      }))
    });

  } catch (error: any) {
    console.error('❌ [Migrate Now] Error getting status:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error obteniendo estado',
        error: error.message 
      },
      { status: 500 }
    );
  }
}