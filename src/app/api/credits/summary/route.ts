import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AccountReceivable, AccountStatus } from '@/models/AccountReceivable';

// GET /api/credits/summary - Obtener resumen de cuentas por cobrar
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }
    
    console.log('📊 [Credits Summary API] Generando resumen para tienda:', storeId);
    
    const now = new Date();
    
    // Obtener todas las cuentas activas
    const allAccounts = await AccountReceivable.find({
      storeId,
      status: { $nin: [AccountStatus.PAID, AccountStatus.CANCELLED] }
    }).lean();
    
    // Calcular métricas
    const summary = {
      // Totales generales
      totalAccounts: allAccounts.length,
      totalAmount: allAccounts.reduce((sum, acc) => sum + acc.originalAmount, 0),
      totalPaid: allAccounts.reduce((sum, acc) => sum + acc.paidAmount, 0),
      totalPending: allAccounts.reduce((sum, acc) => sum + acc.remainingBalance, 0),
      
      // Por estado
      byStatus: {
        pending: allAccounts.filter(acc => acc.status === AccountStatus.PENDING).length,
        partial: allAccounts.filter(acc => acc.status === AccountStatus.PARTIAL).length,
        overdue: allAccounts.filter(acc => acc.status === AccountStatus.OVERDUE).length
      },
      
      // Montos por estado
      amountsByStatus: {
        pending: allAccounts
          .filter(acc => acc.status === AccountStatus.PENDING)
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        partial: allAccounts
          .filter(acc => acc.status === AccountStatus.PARTIAL)
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        overdue: allAccounts
          .filter(acc => acc.status === AccountStatus.OVERDUE)
          .reduce((sum, acc) => sum + acc.remainingBalance, 0)
      },
      
      // Análisis de vencimientos (aging)
      aging: {
        current: allAccounts.filter(acc => new Date(acc.dueDate) >= now).length,
        days1to30: allAccounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 1 && daysPastDue <= 30;
        }).length,
        days31to60: allAccounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 31 && daysPastDue <= 60;
        }).length,
        days61to90: allAccounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 61 && daysPastDue <= 90;
        }).length,
        over90: allAccounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue > 90;
        }).length
      },
      
      // Montos por aging
      agingAmounts: {
        current: allAccounts
          .filter(acc => new Date(acc.dueDate) >= now)
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        days1to30: allAccounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 1 && daysPastDue <= 30;
          })
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        days31to60: allAccounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 31 && daysPastDue <= 60;
          })
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        days61to90: allAccounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 61 && daysPastDue <= 90;
          })
          .reduce((sum, acc) => sum + acc.remainingBalance, 0),
        over90: allAccounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue > 90;
          })
          .reduce((sum, acc) => sum + acc.remainingBalance, 0)
      },
      
      // Top clientes con más deuda
      topDebtors: await AccountReceivable.aggregate([
        {
          $match: {
            storeId,
            status: { $nin: [AccountStatus.PAID, AccountStatus.CANCELLED] }
          }
        },
        {
          $group: {
            _id: '$customerId',
            customerName: { $first: '$customerName' },
            customerPhone: { $first: '$customerPhone' },
            totalDebt: { $sum: '$remainingBalance' },
            accountCount: { $sum: 1 },
            oldestDueDate: { $min: '$dueDate' }
          }
        },
        {
          $sort: { totalDebt: -1 }
        },
        {
          $limit: 10
        }
      ]),
      
      // Próximos vencimientos (próximos 7 días)
      upcomingDue: allAccounts.filter(acc => {
        const dueDate = new Date(acc.dueDate);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      
      // Estadísticas de cobro
      collectionStats: {
        averageDaysToCollect: 0, // Se calcularía con cuentas pagadas
        collectionRate: 0, // Porcentaje de cuentas cobradas vs creadas
        averageDebtPerCustomer: allAccounts.length > 0 
          ? allAccounts.reduce((sum, acc) => sum + acc.remainingBalance, 0) / 
            new Set(allAccounts.map(acc => acc.customerId)).size
          : 0
      }
    };
    
    console.log('✅ [Credits Summary API] Resumen generado exitosamente');
    
    return NextResponse.json({
      success: true,
      summary,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Credits Summary API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}