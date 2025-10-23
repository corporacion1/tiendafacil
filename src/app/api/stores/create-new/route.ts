import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { IDGenerator } from '@/lib/id-generator';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { name, businessType, ownerUid } = body;
    
    console.log('🏪 [Create New Store] Datos recibidos:', { name, businessType, ownerUid });
    
    // Validar campos requeridos
    if (!name || !ownerUid) {
      return NextResponse.json(
        { error: "Nombre de tienda y UID del propietario son requeridos" },
        { status: 400 }
      );
    }
    
    // Generar storeId único con 13 dígitos aleatorios
    const generateStoreId = () => {
      const randomDigits = Math.random().toString().slice(2, 15); // 13 dígitos
      return `ST-${randomDigits.padEnd(13, '0')}`;
    };
    
    let storeId = generateStoreId();
    
    // Verificar que el storeId sea único
    let existingStore = await Store.findOne({ storeId });
    while (existingStore) {
      console.log('⚠️ [Create New Store] StoreId ya existe, generando nuevo:', storeId);
      storeId = generateStoreId();
      existingStore = await Store.findOne({ storeId });
    }
    
    console.log('🆔 [Create New Store] StoreId único generado:', storeId);
    
    // Crear datos de la nueva tienda
    const newStoreData = {
      id: storeId,
      storeId: storeId,
      name: name.trim(),
      ownerIds: [ownerUid],
      userRoles: [{ uid: ownerUid, role: 'admin' }],
      businessType: businessType || 'General',
      address: '',
      phone: '',
      slogan: '',
      logoUrl: '',
      meta: '',
      primaryCurrencyName: 'Dólar',
      primaryCurrencySymbol: '$',
      secondaryCurrencyName: 'Bolívar',
      secondaryCurrencySymbol: 'Bs.',
      saleSeries: 'A',
      saleCorrelative: 1,
      tax1: 0,
      tax2: 0,
      whatsapp: '',
      tiktok: '',
      useDemoData: true,
      status: 'active'
    };
    
    // Crear la tienda
    console.log('🏪 [Create New Store] Creando tienda:', newStoreData.name);
    const createdStore = await Store.create(newStoreData);
    
    // Sembrar datos demo automáticamente
    console.log('🌱 [Create New Store] Iniciando siembra automática para:', storeId);
    
    try {
      const seedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      });
      
      if (seedResponse.ok) {
        console.log('✅ [Create New Store] Siembra completada exitosamente');
      } else {
        console.warn('⚠️ [Create New Store] Error en siembra, pero tienda creada');
      }
    } catch (seedError) {
      console.error('❌ [Create New Store] Error en siembra:', seedError);
      // No fallar la creación de tienda por error en siembra
    }
    
    console.log('✅ [Create New Store] Tienda creada exitosamente:', createdStore.storeId);
    
    return NextResponse.json({
      success: true,
      message: 'Tienda creada y sembrada exitosamente',
      store: {
        storeId: createdStore.storeId,
        name: createdStore.name,
        businessType: createdStore.businessType,
        ownerIds: createdStore.ownerIds,
        status: createdStore.status,
        useDemoData: createdStore.useDemoData,
        createdAt: createdStore.createdAt
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Create New Store] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al crear la tienda',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}