import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CurrencyRate } from '@/models/CurrencyRate';
import { IDGenerator } from '@/lib/id-generator';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    console.log('📊 [Currency API] Datos recibidos:', body);
    
    const { storeId, rate, userId } = body;

    // Validación mejorada
    if (!storeId) {
      console.error('❌ [Currency API] StoreId faltante');
      return NextResponse.json(
        { error: "StoreId es requerido" },
        { status: 400 }
      );
    }
    
    if (isNaN(rate) || rate <= 0) {
      console.error('❌ [Currency API] Tasa inválida:', rate);
      return NextResponse.json(
        { error: "Tasa debe ser un número válido mayor a 0" },
        { status: 400 }
      );
    }

    console.log('🔄 [Currency API] Desactivando tasas anteriores para storeId:', storeId);
    
    // 1. Desactivar todas las tasas anteriores
    const updateResult = await CurrencyRate.updateMany(
      { storeId },
      { $set: { active: false } }
    );
    
    console.log('✅ [Currency API] Tasas desactivadas:', updateResult.modifiedCount);

    // 2. Crear nueva tasa activa
    const rateData = {
      id: IDGenerator.generate('rate'),
      storeId,
      rate: Number(rate),
      date: new Date().toISOString(),
      createdBy: userId || 'system',
      active: true
    };
    
    console.log('💾 [Currency API] Creando nueva tasa:', rateData);
    
    const newRate = await CurrencyRate.create(rateData);
    
    console.log('✅ [Currency API] Tasa creada exitosamente:', newRate._id);

    return NextResponse.json({ 
      success: true,
      data: newRate 
    });

  } catch (error: any) {
    console.error('❌ [Currency API] Error completo:', error);
    console.error('❌ [Currency API] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || "Error al guardar tasa",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: "Se requiere storeId" },
        { status: 400 }
      );
    }

    // Obtener tasa activa actual
    const currentRate = await CurrencyRate.findOne({ 
      storeId, 
      active: true 
    }).sort({ createdAt: -1 });

    // Obtener historial (últimas 10)
    const history = await CurrencyRate.find({ 
      storeId 
    }).sort({ createdAt: -1 }).limit(10);

    return NextResponse.json({ 
      success: true,
      data: {
        current: currentRate,
        history
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}