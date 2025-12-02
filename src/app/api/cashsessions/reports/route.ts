import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { sessionId, storeId, closingBalance, closedBy } = data;

        if (!sessionId || !storeId || closingBalance === undefined) {
            return NextResponse.json({
                error: "Campos requeridos: sessionId, storeId, closingBalance"
            }, { status: 400 });
        }

        console.log('🔒 [CashSessions Reports API] Cerrando sesión:', sessionId);

        // 1. Obtener la sesión actual
        const { data: currentSession, error: fetchError } = await supabaseAdmin
            .from('cash_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('store_id', storeId)
            .single();

        if (fetchError || !currentSession) {
            console.error('❌ Error buscando sesión:', fetchError);
            return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
        }

        if (currentSession.status === 'closed') {
            return NextResponse.json({ error: "La sesión ya está cerrada" }, { status: 400 });
        }

        // 2. Calcular totales
        // Usar las nuevas columnas si existen, fallback a las viejas
        const openingBalance = currentSession.opening_balance ?? currentSession.opening_amount ?? 0;

        // En una implementación real, aquí podríamos recalcular el total de ventas desde la tabla 'sales'
        // para asegurar consistencia. Por ahora usamos los acumuladores de la sesión.
        const cashFromSales = currentSession.total_cash || 0;
        const calculatedCash = openingBalance + cashFromSales;
        const difference = closingBalance - calculatedCash;
        const closingDate = new Date().toISOString();

        // 3. Preparar datos de actualización (usando nuevas y viejas columnas)
        const updateData = {
            status: 'closed',
            closing_balance: closingBalance,
            closing_amount: closingBalance, // Compatibilidad
            closing_date: closingDate,
            closed_at: closingDate, // Compatibilidad
            closed_by: closedBy,
            calculated_cash: calculatedCash,
            difference: difference
        };

        console.log('📊 [CashSessions Reports API] Datos de cierre:', {
            openingBalance,
            cashFromSales,
            calculatedCash,
            closingBalance,
            difference
        });

        // 4. Actualizar sesión en BD
        const { data: closedSession, error: updateError } = await supabaseAdmin
            .from('cash_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error cerrando sesión:', updateError);
            throw updateError;
        }

        console.log('✅ [CashSessions Reports API] Sesión cerrada exitosamente');

        // 5. Formatear respuesta
        const formattedSession = {
            ...closedSession,
            storeId: closedSession.store_id,
            openingBalance: closedSession.opening_balance,
            openingDate: closedSession.opening_date,
            closingBalance: closedSession.closing_balance,
            closingDate: closedSession.closing_date,
            openedBy: closedSession.opened_by,
            closedBy: closedSession.closed_by,
            calculatedCash: closedSession.calculated_cash,
            difference: closedSession.difference,
            salesIds: closedSession.sales_ids || [],
            transactions: closedSession.transactions || {}
        };

        return NextResponse.json({
            success: true,
            session: formattedSession,
            report: {
                generatedAt: closingDate,
                summary: {
                    openingBalance,
                    totalSales: closedSession.total_sales,
                    totalCash: closedSession.total_cash,
                    totalCard: closedSession.total_card,
                    totalTransfer: closedSession.total_transfer,
                    expectedCash: calculatedCash,
                    actualCash: closingBalance,
                    difference
                }
            }
        });

    } catch (error: any) {
        console.error('❌ [CashSessions Reports API] Error general:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
