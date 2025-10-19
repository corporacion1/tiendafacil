// src/app/api/stores/seed/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('🌱 [Store Seed] Iniciando seed de tienda por defecto...');

    const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';
    
    // Check if store already exists
    const existingStore = await Store.findOne({ storeId: defaultStoreId });
    
    if (existingStore) {
      console.log('✅ [Store Seed] Tienda por defecto ya existe:', existingStore.name);
      return NextResponse.json({
        success: true,
        message: 'Tienda por defecto ya existe',
        store: existingStore
      });
    }

    // Create default store
    const defaultStore = {
      storeId: defaultStoreId,
      name: 'TiendaFácil Demo',
      ownerIds: ['user_demo_001'],
      userRoles: [
        { uid: 'user_demo_001', role: 'admin' }
      ],
      address: 'Dirección de ejemplo, Ciudad, País',
      businessType: 'retail',
      phone: '+1234567890',
      slogan: 'Tu tienda fácil y rápida',
      logoUrl: '/tienda_facil_logo.svg',
      meta: 'Tienda de demostración para TiendaFácil',
      primaryCurrencyName: 'Peso Dominicano',
      primaryCurrencySymbol: 'RD$',
      secondaryCurrencyName: 'Dólar Americano',
      secondaryCurrencySymbol: 'US$',
      saleSeries: 'B01',
      saleCorrelative: 1,
      tax1: 18, // ITBIS
      tax2: 0,
      whatsapp: '+1234567890',
      tiktok: '@tiendafacil',
      useDemoData: true
    };

    const createdStore = await Store.create(defaultStore);
    console.log('✅ [Store Seed] Tienda por defecto creada:', createdStore.name);

    return NextResponse.json({
      success: true,
      message: 'Tienda por defecto creada exitosamente',
      store: createdStore
    });

  } catch (error: any) {
    console.error('❌ [Store Seed] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error creando tienda por defecto',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    const stores = await Store.find({}).limit(10);
    const storeCount = await Store.countDocuments({});
    
    return NextResponse.json({
      success: true,
      count: storeCount,
      stores: stores.map(store => ({
        storeId: store.storeId,
        name: store.name,
        businessType: store.businessType,
        useDemoData: store.useDemoData,
        createdAt: store.createdAt
      }))
    });

  } catch (error: any) {
    console.error('❌ [Store Seed] Error obteniendo tiendas:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error obteniendo información de tiendas',
        error: error.message 
      },
      { status: 500 }
    );
  }
}