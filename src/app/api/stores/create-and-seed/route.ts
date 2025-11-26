import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { name, ownerEmail, businessType, address, phone } = body;
    
    console.log('🏪 [Create Store and Seed] Datos recibidos:', { name, ownerEmail, businessType, address, phone });
    
    // Validar campos requeridos
    if (!name || !ownerEmail) {
      return NextResponse.json(
        { error: "Nombre de tienda y email del propietario son requeridos" },
        { status: 400 }
      );
    }
    
    // Buscar el usuario por email
    const user = await User.findOne({ email: ownerEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado con el email proporcionado" },
        { status: 404 }
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
      console.log('⚠️ [Create Store and Seed] StoreId ya existe, generando nuevo:', storeId);
      storeId = generateStoreId();
      existingStore = await Store.findOne({ storeId });
    }
    
    console.log('🆔 [Create Store and Seed] StoreId único generado:', storeId);
    
    // Crear datos de la nueva tienda
    const newStoreData = {
      id: storeId,
      storeId: storeId,
      name: name.trim(),
      ownerIds: [user.uid],
      userRoles: [{ uid: user.uid, role: 'admin' }],
      businessType: businessType || 'General',
      address: address || '',
      phone: phone || '',
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
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Crear la tienda
    console.log('🏪 [Create Store and Seed] Creando tienda:', newStoreData.name);
    const createdStore = await Store.create(newStoreData);
    
    // Sembrar datos demo automáticamente
    console.log('🌱 [Create Store and Seed] Iniciando siembra automática para:', storeId);
    
    try {
      const seedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      });
      
      if (seedResponse.ok) {
        console.log('✅ [Create Store and Seed] Siembra completada exitosamente');
      } else {
        const seedError = await seedResponse.text();
        console.warn('⚠️ [Create Store and Seed] Error en siembra:', seedError);
      }
    } catch (seedError) {
      console.error('❌ [Create Store and Seed] Error en siembra:', seedError);
      // No fallar la creación de tienda por error en siembra
    }
    
    console.log('✅ [Create Store and Seed] Tienda creada exitosamente:', createdStore.storeId);
    
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
        address: createdStore.address,
        phone: createdStore.phone,
        createdAt: createdStore.createdAt
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Create Store and Seed] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al crear la tienda',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}