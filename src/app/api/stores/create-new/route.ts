import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, businessType, ownerUid } = body;

        console.log('🚀 [CreateStore API] Received request');
        console.log('📦 [CreateStore API] Body:', { name, businessType, ownerUid });

        if (!name || !ownerUid) {
            console.error('❌ [CreateStore API] Missing required fields');
            return NextResponse.json({ error: 'Name and Owner UID are required' }, { status: 400 });
        }

        // Generate new Store ID
        const storeId = `ST-${Date.now()}`;

        console.log('🆕 [CreateStore API] Generated Store ID:', storeId);
        console.log('🛠️ [CreateStore API] Attempting to insert into Supabase...');

        // Create Store
        const { data: store, error: storeError } = await supabaseAdmin
            .from('stores')
            .insert({
                id: storeId,
                name,
                business_type: businessType,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (storeError) {
            console.error('❌ [CreateStore API] Error creating store in Supabase:', storeError);
            throw new Error(`Error creating store: ${storeError.message}`);
        }

        console.log('✅ [CreateStore API] Store created successfully:', store);

        return NextResponse.json({
            success: true,
            store: {
                ...store,
                storeId: store.id // For compatibility
            }
        });

    } catch (error: any) {
        console.error('❌ [CreateStore API] Error in /api/stores/create-new:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
