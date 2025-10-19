import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ad } from '@/models/Ad';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// POST /api/ads/expire - Forzar inactivación de anuncios vencidos (para testing/admin)
export async function POST() {
  try {
    await connectToDatabase();
    
    const now = new Date();
    logDatabaseOperation('POST', 'ads/expire', { timestamp: now.toISOString() });
    
    // Buscar anuncios vencidos que aún estén activos
    const expiredAds = await Ad.find({
      expiryDate: { $lt: now.toISOString() },
      status: 'active'
    });
    
    if (expiredAds.length === 0) {
      return NextResponse.json({ 
        message: 'No hay anuncios vencidos para inactivar',
        expiredCount: 0 
      });
    }
    
    // Inactivar anuncios vencidos
    const result = await Ad.updateMany(
      {
        expiryDate: { $lt: now.toISOString() },
        status: 'active'
      },
      {
        $set: { status: 'inactive' }
      }
    );
    
    console.log(`🔄 [ADS] ${result.modifiedCount} anuncios vencidos marcados como inactivos`);
    
    return NextResponse.json({ 
      message: `${result.modifiedCount} anuncios vencidos han sido inactivados`,
      expiredCount: result.modifiedCount,
      expiredAds: expiredAds.map(ad => ({
        id: ad.id,
        name: ad.name,
        expiryDate: ad.expiryDate
      }))
    });
  } catch (error) {
    return handleDatabaseError(error, 'POST ads/expire');
  }
}