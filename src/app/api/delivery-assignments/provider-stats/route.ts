import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const providerId = searchParams.get('providerId');
        const storeId = searchParams.get('storeId');

        if (!providerId || !storeId) {
            return NextResponse.json({ error: 'providerId y storeId son requeridos' }, { status: 400 });
        }

        // Obtener fecha de inicio del día actual (UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.toISOString();

        const { data: assignments, error } = await supabaseAdmin
            .from('delivery_assignments')
            .select('delivery_status, provider_commission_amount')
            .eq('delivery_provider_id', providerId)
            .eq('store_id', storeId)
            .gte('assigned_at', startOfDay);

        if (error) throw error;

        const stats = {
            total: assignments?.length || 0,
            completed: assignments?.filter((a: any) => a.delivery_status === 'delivered').length || 0,
            pending: assignments?.filter((a: any) => ['pending', 'picked_up', 'in_transit'].includes(a.delivery_status)).length || 0,
            earnings: assignments?.filter((a: any) => a.delivery_status === 'delivered')
                .reduce((sum: number, a: any) => sum + (a.provider_commission_amount || 0), 0) || 0,
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('❌ Error fetching provider stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
