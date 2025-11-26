import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CreditsSyncService } from '@/lib/credits-sync';

// POST /api/credits/sync - Utilidades de sincronización
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { action, storeId, autoFix = false } = data;
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }
    
    console.log('🔄 [Credits Sync API] Ejecutando acción:', action, 'para tienda:', storeId);
    
    let result;
    
    switch (action) {
      case 'validate':
        result = await CreditsSyncService.validateConsistency(storeId);
        break;
        
      case 'repair':
        result = await CreditsSyncService.repairInconsistencies(storeId, autoFix);
        break;
        
      case 'migrate':
        result = await CreditsSyncService.migrateExistingCreditSales(storeId);
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Acción no válida. Use: validate, repair, migrate' 
        }, { status: 400 });
    }
    
    console.log('✅ [Credits Sync API] Acción completada:', action);
    
    return NextResponse.json({
      success: true,
      action,
      storeId,
      result
    });
    
  } catch (error: any) {
    console.error('❌ [Credits Sync API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/credits/sync - Obtener estado de sincronización
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }
    
    console.log('📊 [Credits Sync API] Verificando estado de sincronización para:', storeId);
    
    const inconsistencies = await CreditsSyncService.validateConsistency(storeId);
    
    return NextResponse.json({
      success: true,
      storeId,
      isConsistent: inconsistencies.length === 0,
      inconsistencyCount: inconsistencies.length,
      inconsistencies: inconsistencies.slice(0, 10), // Limitar a 10 para la respuesta
      summary: {
        missingAccounts: inconsistencies.filter(i => i.type === 'missing_account').length,
        amountMismatches: inconsistencies.filter(i => i.type === 'amount_mismatch').length,
        paymentMismatches: inconsistencies.filter(i => i.type === 'payment_mismatch').length,
        statusMismatches: inconsistencies.filter(i => i.type === 'status_mismatch').length
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Credits Sync API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}