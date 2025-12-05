import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        console.log('🏭 [Production API] Changing store to production mode:', storeId);

        // Check if store exists
        const { data: store, error: storeError } = await supabaseAdmin
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
        const { error: updateError } = await supabaseAdmin
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
