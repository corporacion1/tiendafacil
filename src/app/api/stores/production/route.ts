import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function POST(request: Request) {
    try {
        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        console.log('🏭 [Production API] Changing store to production mode:', storeId);

        // Check if store exists
        const { data: store, error: storeError } = await dbAdmin
            .from('stores')
            .select('status')
            .eq('id', storeId)
            .single();

        if (storeError) {
            console.error('❌ [Production API] Error fetching store:', storeError);
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (store.status === 'inProduction') {
            return NextResponse.json(
                { error: 'Store is already in production mode' },
                { status: 400 }
            );
        }

        // Update store status to production
        const { error: updateError } = await dbAdmin
            .from('stores')
            .update({
                status: 'inProduction',
                updated_at: new Date().toISOString()
            })
            .eq('id', storeId);

        if (updateError) {
            console.error('❌ [Production API] Error updating store status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update store status' },
                { status: 500 }
            );
        }

        console.log('✅ [Production API] Store status changed to production successfully');

        return NextResponse.json({
            success: true,
            message: 'Store status changed to production successfully'
        });

    } catch (error: any) {
        console.error('❌ [Production API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to change store to production' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        console.log('🔍 [Production API] Fetching all production stores...');
        
        const { data: stores, error } = await dbAdmin
            .from('stores')
            .select('*')
            .not('status', 'eq', 'inactive')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ [Production API] Error fetching stores:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const productionStores = (stores || []).filter((s: any) => 
            s.status === 'inProduction' || 
            s.status === 'active'
        ).filter((s: any) => s.id !== 'ST-1234567890123');

        console.log(`✅ [Production API] Found ${productionStores.length} production stores`);

        return NextResponse.json({
            stores: productionStores
        });
    } catch (error: any) {
        console.error('❌ [Production API] Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
