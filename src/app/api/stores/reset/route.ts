import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db-client';

export async function POST(request: Request) {
    try {
        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        console.log('🗑️ [Reset API] Resetting data for store:', storeId);

        // Check if store is in production
        const { data: store, error: storeError } = await dbAdmin
            .from('stores')
            .select('status')
            .eq('id', storeId)
            .single();

        if (storeError) {
            console.error('❌ [Reset API] Error fetching store:', storeError);
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (store.status === 'inProduction') {
            return NextResponse.json(
                { error: 'Cannot reset a store in production mode' },
                { status: 403 }
            );
        }

        // Delete all transactional data for this store
        console.log('🗑️ [Reset API] Deleting products...');
        await dbAdmin.from('products').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting sales...');
        await dbAdmin.from('sales').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting purchases...');
        await dbAdmin.from('purchases').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting inventory movements...');
        await dbAdmin.from('inventory_movements').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting customers...');
        await dbAdmin.from('customers').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting suppliers...');
        await dbAdmin.from('suppliers').delete().eq('store_id', storeId);

        console.log('🗑️ [Reset API] Deleting cash sessions...');
        await dbAdmin.from('cash_sessions').delete().eq('store_id', storeId);

        console.log('✅ [Reset API] Store data reset successfully');

        return NextResponse.json({
            success: true,
            message: 'Store data has been reset successfully'
        });

    } catch (error: any) {
        console.error('❌ [Reset API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset store data' },
            { status: 500 }
        );
    }
}
