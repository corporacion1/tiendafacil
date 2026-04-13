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
        // Schema: id, store_id, product_id, warehouse_id, movement_type, quantity, reference_type, user_id, notes, created_at, previous_stock, new_stock, unit_cost, total_value, batch_id, updated_at
        const movementData = {
            id: IDGenerator.generate('movement'),
            product_id,
            store_id,
            warehouse_id: null,
            movement_type: 'adjustment',
            quantity: quantity,
            previous_stock: previousStock,
            new_stock,
            reference_type: 'manual_adjustment',
            notes: reason || 'Manual adjustment',
            user_id: user_id || 'system',
            unit_cost: unitCost,
            total_value: unitCost * Math.abs(quantity),
            batch_id: null,
            created_at: new Date().toISOString(),
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
        const { product_id, store_id, movement_type, quantity, warehouse_id, notes, user_id, reference_type, reference_id } = body;

        console.log('📦 [Inventory Movements] POST - Creating movement:', body);

        if (!product_id || !store_id || !movement_type) {
            return NextResponse.json(
                { error: 'product_id, store_id, and movement_type are required' },
                { status: 400 }
            );
        }

        // 1. Get current product to calculate stock change and get cost
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('stock, cost, type')
            .eq('id', product_id)
            .eq('store_id', store_id)
            .single();

        if (productError || !product) {
            console.error('❌ [Inventory Movements] Error fetching product:', productError);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const previousStock = product.stock || 0;
        const movementQuantity = Number(quantity) || 0;
        const newStock = previousStock + movementQuantity;
        const unitCost = product.cost || 0;

        // 2. Update product stock (only if it affects inventory)
        if (product.type !== 'service') {
            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', product_id)
                .eq('store_id', store_id);

            if (updateError) {
                console.error('❌ [Inventory Movements] Error updating stock:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        }

        // 3. Create movement record
        const movementData = {
            id: IDGenerator.generate('movement'),
            product_id,
            store_id,
            warehouse_id: warehouse_id || null,
            movement_type,
            quantity: movementQuantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: reference_type || 'manual_adjustment',
            reference_id: reference_id || `manual_${Date.now()}`,
            user_id: user_id || 'system',
            unit_cost: unitCost,
            total_value: unitCost * Math.abs(movementQuantity),
            notes: notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: movement, error: movementError } = await supabaseAdmin
            .from('inventory_movements')
            .insert(movementData)
            .select()
            .single();

        if (movementError) {
            console.error('❌ [Inventory Movements] Error creating movement:', movementError);
            // Even if movement record fails, the stock was updated, so we return 500 but log the discrepancy
            return NextResponse.json({ error: movementError.message }, { status: 500 });
        }

        console.log('✅ [Inventory Movements] Movement created and stock updated:', movement.id);

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
            .order('created_at', { ascending: false });

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
