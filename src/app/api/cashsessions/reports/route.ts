import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('sessionId');
        const type = url.searchParams.get('type');
        const storeId = url.searchParams.get('storeId');

        if (!sessionId || !type || !storeId) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        console.log(`📊 [Report API] Generando reporte ${type} para sesión ${sessionId}`);

        // 1. Obtener la sesión
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('cash_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('store_id', storeId)
            .single();

        if (sessionError || !session) {
            console.error('❌ Error buscando sesión:', sessionError);
            throw new Error('Sesión no encontrada');
        }

        // 2. Definir rango de fechas
        const startDate = session.opening_date;
        const endDate = session.closing_date || new Date().toISOString();

        // 3. Obtener ventas del período
        let sales: any[] = [];
        let salesError: any = null;

        // Intentar primero con filtro por serie (si la columna existe)
        if (session.series) {
            console.log(`📊 [Report API] Intentando filtrar ventas por serie: ${session.series}`);
            
            const { data: seriesFilteredSales, error: seriesError } = await supabaseAdmin
                .from('sales')
                .select('*')
                .eq('store_id', storeId)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .neq('status', 'cancelled')
                .eq('series', session.series);

            // Si el filtro por serie falla (columna no existe), usar consulta sin serie
            if (seriesError && seriesError.code === '42703') {
                console.log(`⚠️ [Report API] Columna 'series' no existe, obteniendo todas las ventas del período`);
                
                const { data: allSales, error: allSalesError } = await supabaseAdmin
                    .from('sales')
                    .select('*')
                    .eq('store_id', storeId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .neq('status', 'cancelled');

                sales = allSales || [];
                salesError = allSalesError;
            } else {
                sales = seriesFilteredSales || [];
                salesError = seriesError;
            }
        } else {
            // Si no hay serie en la sesión, obtener todas las ventas del período
            const { data: allSales, error: allSalesError } = await supabaseAdmin
                .from('sales')
                .select('*')
                .eq('store_id', storeId)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .neq('status', 'cancelled');

            sales = allSales || [];
            salesError = allSalesError;
        }

        if (salesError) {
            console.error('❌ Error buscando ventas:', salesError);
            throw new Error('Error al obtener ventas');
        }

        // 4. Calcular totales
        const salesData = sales || [];

        const totalSales = salesData.length;
        // Para el total de ingresos, usar paid_amount para créditos y total para contado (si las columnas existen)
        const totalAmount = salesData.reduce((sum: number, sale: any) => {
            // Verificar si existen las columnas de crédito
            if (sale.transaction_type && sale.transaction_type === 'credito' && sale.paid_amount !== undefined) {
                return sum + (sale.paid_amount || 0);
            } else {
                return sum + (sale.total || 0);
            }
        }, 0);
        const totalItems = salesData.reduce((sum: number, sale: any) => sum + (sale.items?.length || 0), 0); // Asumiendo que items es un array JSON
        const totalTax = salesData.reduce((sum: number, sale: any) => sum + (sale.tax || 0), 0);
        const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;

        // Agrupar por método de pago
        const paymentMethods: Record<string, number> = {};
        salesData.forEach((sale: any) => {
            // Para ventas a crédito, solo contar el monto abonado, no el total (si las columnas existen)
            let amountToCount: number;
            if (sale.transaction_type && sale.transaction_type === 'credito' && sale.paid_amount !== undefined) {
                amountToCount = sale.paid_amount || 0;
            } else {
                amountToCount = sale.total || 0;
            }
            
            const method = sale.payment_method || 'Efectivo';
            paymentMethods[method] = (paymentMethods[method] || 0) + amountToCount;
        });

        // 5. Calcular balances
        const openingBalance = session.opening_balance || 0;
        const cashSales = paymentMethods['Efectivo'] || 0;
        const calculatedCash = openingBalance + cashSales;

        // Si es reporte Z y ya se cerró, usar el balance de cierre real
        const closingBalance = session.closing_balance !== null ? session.closing_balance : undefined;
        const difference = closingBalance !== undefined ? closingBalance - calculatedCash : 0;

        // 6. Preparar respuesta
        const reportData = {
            sessionId: session.id,
            storeId: session.store_id,
            reportType: type,
            generatedAt: new Date().toISOString(),
            session: {
                openingDate: session.opening_date,
                closingDate: session.closing_date,
                openedBy: session.opened_by,
                closedBy: session.closed_by,
                status: session.status,
                xReports: (session.x_reports_count || 0) + (type === 'X' ? 1 : 0)
            },
            balances: {
                openingBalance,
                closingBalance,
                calculatedCash,
                difference
            },
            sales: {
                count: totalSales,
                totalAmount,
                totalItems,
                totalTax,
                averageTicket
            },
            paymentMethods,
            salesDetails: salesData.map((sale: any) => ({
                id: sale.id,
                date: sale.created_at,
                customerName: sale.customer_name || 'Cliente General',
                total: sale.total,
                items: sale.items?.length || 0,
                paymentMethod: sale.payment_method
            }))
        };

        return NextResponse.json(reportData);

    } catch (error: any) {
        console.error('❌ [Report API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        // 2. Calcular totales desde ventas
        const startDate = currentSession.opening_date;
        const closingDate = new Date().toISOString();

        const { data: sales, error: salesError } = await supabaseAdmin
            .from('sales')
            .select('*')
            .eq('store_id', storeId)
            .gte('created_at', startDate)
            .lte('created_at', closingDate)
            .neq('status', 'cancelled');

        if (salesError) {
            console.error('❌ Error buscando ventas para cierre:', salesError);
            throw new Error('Error al calcular totales de ventas');
        }

        const salesData = sales || [];

        // Calcular efectivo real de ventas
        const cashSales = salesData
            .filter((s: any) => s.payment_method === 'Efectivo')
            .reduce((sum: number, s: any) => sum + (s.total || 0), 0);

        const totalSales = salesData.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        const totalCard = salesData
            .filter((s: any) => s.payment_method === 'Tarjeta')
            .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        const totalTransfer = salesData
            .filter((s: any) => s.payment_method === 'Transferencia')
            .reduce((sum: number, s: any) => sum + (s.total || 0), 0);

        const openingBalance = currentSession.opening_balance || 0;
        const calculatedCash = openingBalance + cashSales;
        const difference = closingBalance - calculatedCash;

        // 3. Preparar datos de actualización
        const updateData = {
            status: 'closed',
            closing_balance: closingBalance,
            closing_amount: closingBalance, // Compatibilidad
            closing_date: closingDate,
            closed_at: closingDate, // Compatibilidad
            closed_by: closedBy,
            calculated_cash: calculatedCash,
            difference: difference,
            total_sales: totalSales,
            total_cash: cashSales,
            total_card: totalCard,
            total_transfer: totalTransfer
        };

        console.log('📊 [CashSessions Reports API] Datos de cierre calculados:', updateData);

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
