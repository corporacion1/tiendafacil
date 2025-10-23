import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CurrencyRate } from '@/models/CurrencyRate';
import { IDGenerator } from '@/lib/id-generator';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'ST-1234567890123' } = await request.json().catch(() => ({}));
    
    console.log('🌱 [Currency Seed] Creando tasa de cambio inicial para storeId:', storeId);
    
    // Verificar si ya existe una tasa activa
    const existingRate = await CurrencyRate.findOne({ 
      storeId, 
      active: true 
    });
    
    if (existingRate) {
      console.log('✅ [Currency Seed] Ya existe una tasa activa:', existingRate.rate);
      return NextResponse.json({ 
        success: true,
        message: 'Ya existe una tasa de cambio activa',
        data: existingRate 
      });
    }
    
    // Crear nueva tasa inicial
    const rateData = {
      id: IDGenerator.generate('rate'),
      storeId,
      rate: 36.50, // Tasa inicial de ejemplo
      date: new Date().toISOString(),
      createdBy: 'system-seed',
      active: true
    };
    
    console.log('💾 [Currency Seed] Creando tasa inicial:', rateData);
    
    const newRate = await CurrencyRate.create(rateData);
    
    console.log('✅ [Currency Seed] Tasa creada exitosamente:', newRate._id);

    return NextResponse.json({ 
      success: true,
      message: 'Tasa de cambio inicial creada',
      data: newRate 
    });

  } catch (error: any) {
    console.error('❌ [Currency Seed] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || "Error al crear tasa inicial",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}