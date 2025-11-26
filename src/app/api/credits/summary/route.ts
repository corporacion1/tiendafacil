import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/credits/summary - Obtener resumen de cuentas por cobrar
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 });
    }

    console.log('📊 [Credits Summary API] Generando resumen para tienda:', storeId);

    const now = new Date();

    // Obtener todas las cuentas activas (no pagadas ni canceladas)
    const { data: allAccounts, error } = await supabase
      .from('account_receivables')
      .select('*')
      .eq('store_id', storeId)
      .not('status', 'in', '("paid","cancelled")');

    if (error) {
      console.error('❌ [Credits Summary API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const accounts = allAccounts || [];

    // Calcular métricas
    const summary = {
      // Totales generales
      totalAccounts: accounts.length,
      totalAmount: accounts.reduce((sum, acc) => sum + (acc.original_amount || 0), 0),
      totalPaid: accounts.reduce((sum, acc) => sum + (acc.paid_amount || 0), 0),
      totalPending: accounts.reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),

      // Por estado
      byStatus: {
        pending: accounts.filter(acc => acc.status === 'pending').length,
        partial: accounts.filter(acc => acc.status === 'partial').length,
        overdue: accounts.filter(acc => acc.status === 'overdue').length
      },

      // Montos por estado
      amountsByStatus: {
        pending: accounts
          .filter(acc => acc.status === 'pending')
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        partial: accounts
          .filter(acc => acc.status === 'partial')
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        overdue: accounts
          .filter(acc => acc.status === 'overdue')
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0)
      },

      // Análisis de vencimientos (aging)
      aging: {
        current: accounts.filter(acc => new Date(acc.due_date) >= now).length,
        days1to30: accounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 1 && daysPastDue <= 30;
        }).length,
        days31to60: accounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 31 && daysPastDue <= 60;
        }).length,
        days61to90: accounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= 61 && daysPastDue <= 90;
        }).length,
        over90: accounts.filter(acc => {
          const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue > 90;
        }).length
      },

      // Montos por aging
      agingAmounts: {
        current: accounts
          .filter(acc => new Date(acc.due_date) >= now)
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        days1to30: accounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 1 && daysPastDue <= 30;
          })
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        days31to60: accounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 31 && daysPastDue <= 60;
          })
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        days61to90: accounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue >= 61 && daysPastDue <= 90;
          })
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0),
        over90: accounts
          .filter(acc => {
            const daysPastDue = Math.floor((now.getTime() - new Date(acc.due_date).getTime()) / (1000 * 60 * 60 * 24));
            return daysPastDue > 90;
          })
          .reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0)
      },

      // Top clientes con más deuda (agregación manual en JS)
      topDebtors: (() => {
        const debtorMap = new Map();

        accounts.forEach(acc => {
          const customerId = acc.customer_id;
          if (!debtorMap.has(customerId)) {
            debtorMap.set(customerId, {
              _id: customerId,
              customerName: acc.customer_name,
              customerPhone: acc.customer_phone,
              totalDebt: 0,
              accountCount: 0,
              oldestDueDate: acc.due_date
            });
          }

          const debtor = debtorMap.get(customerId);
          debtor.totalDebt += acc.remaining_balance || 0;
          debtor.accountCount += 1;

          if (new Date(acc.due_date) < new Date(debtor.oldestDueDate)) {
            debtor.oldestDueDate = acc.due_date;
          }
        });

        return Array.from(debtorMap.values())
          .sort((a, b) => b.totalDebt - a.totalDebt)
          .slice(0, 10);
      })(),

      // Próximos vencimientos (próximos 7 días)
      upcomingDue: accounts
        .filter(acc => {
          const dueDate = new Date(acc.due_date);
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          return dueDate >= now && dueDate <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .map(acc => ({
          id: acc.id,
          saleId: acc.sale_id,
          customerId: acc.customer_id,
          customerName: acc.customer_name,
          customerPhone: acc.customer_phone,
          originalAmount: acc.original_amount,
          paidAmount: acc.paid_amount,
          remainingBalance: acc.remaining_balance,
          saleDate: acc.sale_date,
          dueDate: acc.due_date,
          lastPaymentDate: acc.last_payment_date,
          status: acc.status,
          creditDays: acc.credit_days,
          payments: acc.payments || [],
          createdAt: acc.created_at,
          updatedAt: acc.updated_at
        })),

      // Estadísticas de cobro
      collectionStats: {
        averageDaysToCollect: 0, // Se calcularía con cuentas pagadas
        collectionRate: 0, // Porcentaje de cuentas cobradas vs creadas
        averageDebtPerCustomer: accounts.length > 0
          ? accounts.reduce((sum, acc) => sum + (acc.remaining_balance || 0), 0) /
          new Set(accounts.map(acc => acc.customer_id)).size
          : 0
      },

      lastUpdated: new Date().toISOString()
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