import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { migrateStoreProducts, checkMigrationStatus } from '@/lib/product-migration';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ message: 'storeId is required' }, { status: 400 });
    }

    const status = await checkMigrationStatus(storeId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking migration status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] Iniciando migración masiva de productos');
    
    await connectToDatabase();
    
    const { storeId } = await request.json();
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    console.log('🏪 [API] Iniciando migración para la tienda:', storeId);
    
    const migrationResult = await migrateStoreProducts(storeId);

    logDatabaseOperation('POST', 'migrate-all-products', {
      storeId,
      totalFound: migrationResult.totalProducts,
      migratedCount: migrationResult.migratedProducts,
      errorsCount: migrationResult.failedProducts
    });

    if (!migrationResult.success) {
      console.error(`❌ [API] Migración para la tienda ${storeId} falló con errores:`, migrationResult.errors);
      return NextResponse.json({
        message: `Migración completada con ${migrationResult.failedProducts} errores.`,
        ...migrationResult
      }, { status: 500 });
    }

    console.log(`🎉 [API] Migración masiva completada para la tienda ${storeId}: ${migrationResult.migratedProducts}/${migrationResult.totalProducts} productos migrados`);
    
    return NextResponse.json({
      message: `Migración masiva completada: ${migrationResult.migratedProducts}/${migrationResult.totalProducts} productos migrados`,
      ...migrationResult
    });
    
  } catch (error) {
    console.error('❌ [API] Error en migración masiva:', error);
    return handleDatabaseError(error, 'POST migrate all products');
  }
}