import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { mockAds } from '@/lib/data';
import { IDGenerator } from '@/lib/id-generator';
import { Ad } from '@/models/Ad';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    console.log('📢 [Seed-Ads] Iniciando carga de Ads...');

    // Limpiar Ads existentes
    const deleteResult = await Ad.deleteMany({});
    console.log('🗑️ [Seed-Ads] Ads eliminados:', deleteResult.deletedCount);

    // Insertar Ads con IDs únicos (usar storeId global)
    const adsToInsert = mockAds.map(a => ({
      ...a,
      id: IDGenerator.generate('ad', 'global'),
      storeId: 'global' // Usar storeId global para ads
    }));

    const insertResult = await Ad.insertMany(adsToInsert);
    console.log('✅ [Seed-Ads] Ads insertados:', insertResult.length);

    return NextResponse.json({
      success: true,
      message: 'Ads cargados exitosamente',
      stats: {
        deleted: deleteResult.deletedCount,
        inserted: insertResult.length
      }
    });

  } catch (error: any) {
    console.error('❌ [Seed-Ads] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}