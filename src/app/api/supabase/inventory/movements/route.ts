import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

// PUT /api/supabase/inventory/movements - Adjust inventory (creates movement record)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { product_id, new_stock, reason, user_id, store_id } = body;

        console.log('📦 [Inventory Movements] PUT - Adjusting inventory:', {
            product_id,
            new_stock,
            reason,
            user_id,
            store_id
        });

        if (!product_id || new_stock === undefined || !store_id) {
            return NextResponse.json(
                { error: 'product_id, new_stock, and store_id are required' },
                { status: 400 }
            );
        }

        // Get current product to calculate the difference
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('stock, cost')
            .eq('id', product_id)
            .eq('store_id', store_id)
            .single();

        if (productError) {
            console.error('❌ [Inventory Movements] Error fetching product:', productError);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const previousStock = product.stock || 0;
        const quantity = new_stock - previousStock;
        const unitCost = product.cost || 0;

        // Update product stock
        const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ stock: new_stock, updated_at: new Date().toISOString() })
            .eq('id', product_id)
            .eq('store_id', store_id);

        if (updateError) {
            console.error('❌ [Inventory Movements] Error updating stock:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Create movement record
        // Schema: id, store_id, product_id, watrhouse_id, movement_type, quantily, reference_type, user_id, notes, created_id, previous_stock, new_stock, unit_cost, total_value, batch_id, updated_at
        const movementData = {
            id: IDGenerator.generate('movement'),
            product_id,
            store_id,
            watrhouse_id: null, // User typo
            movement_type: 'adjustment',
            quantily: quantity, // User typo
            previous_stock: previousStock,
            new_stock,
            reference_type: 'manual_adjustment',
            notes: reason || 'Manual adjustment',
            user_id: user_id || 'system',
            unit_cost: unitCost,
            total_value: unitCost * Math.abs(quantity),
            batch_id: null,
            created_id: new Date().toISOString(), // User typo/naming
            updated_at: new Date().toISOString()
        };

        const { data: movement, error: movementError } = await supabaseAdmin
            .from('inventory_movements')
            .insert(movementData)
            .select()
            .single();

        if (movementError) {
            console.error('❌ [Inventory Movements] Error creating movement:', movementError);
            // Stock was already updated, so we don't fail the request
            console.warn('⚠️ [Inventory Movements] Stock updated but movement not recorded');
        }

        console.log('✅ [Inventory Movements] Stock adjusted successfully');

        return NextResponse.json({
            success: true,
            product_id,
            previous_stock: previousStock,
            new_stock,
            quantity,
            movement: movement || null
        });
    } catch (error: any) {
        console.error('❌ [Inventory Movements] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/supabase/inventory/movements - Create inventory movement
export async function POST(request: Request) {
    try {
        const body = await request.json();

        console.log('📦 [Inventory Movements] POST - Creating movement:', body);

        if (!body.product_id || !body.store_id || !body.movement_type) {
            return NextResponse.json(
                { error: 'product_id, store_id, and movement_type are required' },
                { status: 400 }
            );
        }

        const movementData = {
            id: IDGenerator.generate('movement'),
            product_id: body.product_id,
            store_id: body.store_id,
            watrhouse_id: body.warehouse_id || null, // Map to user typo
            movement_type: body.movement_type,
            quantily: body.quantity || 0, // Map to user typo
            previous_stock: body.previous_stock || 0,
            new_stock: body.new_stock || 0,
            reference_type: body.reference_type || null,
            notes: body.notes || null,
            user_id: body.user_id || 'system',
            unit_cost: body.unit_cost || 0,
            total_value: body.total_value || 0,
            batch_id: body.batch_id || null,
            created_id: new Date().toISOString(), // Map to user naming
            updated_at: new Date().toISOString()
        };

        const { data: movement, error } = await supabaseAdmin
            .from('inventory_movements')
            .insert(movementData)
            .select()
            .single();

        if (error) {
            console.error('❌ [Inventory Movements] Error creating movement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ [Inventory Movements] Movement created:', movement.id);

        return NextResponse.json(movement);
    } catch (error: any) {
        console.error('❌ [Inventory Movements] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/supabase/inventory/movements - Get inventory movements
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('inventory_movements')
            .select('*')
            .eq('store_id', storeId)
            .order('created_id', { ascending: false }); // Use created_id for ordering

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data: movements, error } = await query;

        if (error) {
            console.error('❌ [Inventory Movements] Error fetching movements:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`✅ [Inventory Movements] Returned ${movements.length} movements`);

        // Map back to standard names for frontend if needed, or keep as is.
        // Keeping as is for now to avoid confusion, frontend might need adjustment if it expects standard names.
        return NextResponse.json(movements);
    } catch (error: any) {
        console.error('❌ [Inventory Movements] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
