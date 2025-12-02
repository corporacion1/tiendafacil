
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock supabaseAdmin for the service if needed, but the service imports it.
// We need to ensure the service can import its dependencies.
// Since we are running with ts-node, we need to handle path aliases '@/' if used.
// If path aliases are used, we might need tsconfig-paths.

// Instead of complex setup, let's just copy the relevant logic to verify it, 
// OR try to use the existing service if environment allows.
// Let's try to replicate the logic to verify the "theory" of operation.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectMovementLogic() {
    console.log('🚀 Starting Direct Movement Logic Test...');

    // 1. Setup Data
    const { data: store } = await supabaseAdmin.from('stores').select('id').limit(1).single();
    if (!store) throw new Error('No store found');
    const storeId = store.id;

    const serviceId = `TEST-SERV-DIRECT-${Date.now()}`;
    const productId = `TEST-PROD-DIRECT-${Date.now()}`;

    // Create Service
    await supabaseAdmin.from('products').insert({
        id: serviceId,
        name: 'Direct Test Service',
        type: 'service',
        price: 100,
        cost: 0,
        stock: 0,
        affects_inventory: false,
        store_id: storeId
    });

    // Create Product
    await supabaseAdmin.from('products').insert({
        id: productId,
        name: 'Direct Test Product',
        type: 'product',
        price: 200,
        cost: 100,
        stock: 10,
        affects_inventory: true,
        store_id: storeId
    });

    console.log('✅ Created test items');

    // 2. Simulate Service Logic (Copy-paste from MovementService to verify logic flows)

    // --- LOGIC FOR SERVICE ---
    console.log('\n🧪 Testing Service Logic...');
    const { data: serviceProduct } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', serviceId)
        .single();

    const affectsInventoryService = serviceProduct.type === 'product' && serviceProduct.affects_inventory !== false;
    console.log(`   - Service affectsInventory: ${affectsInventoryService}`);

    if (!affectsInventoryService) {
        const movementData = {
            product_id: serviceId,
            warehouse_id: 'main',
            movement_type: 'SALE',
            quantity: -1,
            unit_cost: 0,
            total_value: 0,
            reference_type: 'SALE_TRANSACTION',
            reference_id: `SALE-DIRECT-${Date.now()}`,
            previous_stock: 0,
            new_stock: 0,
            user_id: 'system',
            notes: 'Test Note (Solo contabilidad - Servicio)',
            store_id: storeId
        };

        const { data: mov, error } = await supabaseAdmin
            .from('inventory_movements')
            .insert([movementData])
            .select()
            .single();

        if (error) console.error('❌ Service Insert Error:', error);
        else console.log('✅ Service Movement Inserted:', mov.id);
    }

    // --- LOGIC FOR PRODUCT ---
    console.log('\n🧪 Testing Product Logic...');
    const { data: physicalProduct } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    const affectsInventoryProduct = physicalProduct.type === 'product' && physicalProduct.affects_inventory !== false;
    console.log(`   - Product affectsInventory: ${affectsInventoryProduct}`);

    if (affectsInventoryProduct) {
        const previousStock = physicalProduct.stock || 0;
        const quantity = -2;
        const newStock = Math.max(0, previousStock + quantity);

        const movementData = {
            product_id: productId,
            warehouse_id: 'main',
            movement_type: 'SALE',
            quantity: quantity,
            unit_cost: physicalProduct.cost,
            total_value: Math.abs(quantity) * physicalProduct.cost,
            reference_type: 'SALE_TRANSACTION',
            reference_id: `SALE-DIRECT-${Date.now()}`,
            previous_stock: previousStock,
            new_stock: newStock,
            user_id: 'system',
            notes: 'Test Note',
            store_id: storeId
        };

        const { data: mov, error } = await supabaseAdmin
            .from('inventory_movements')
            .insert([movementData])
            .select()
            .single();

        if (error) console.error('❌ Product Movement Insert Error:', error);
        else {
            console.log('✅ Product Movement Inserted:', mov.id);

            // Update Stock
            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId);

            if (updateError) console.error('❌ Product Stock Update Error:', updateError);
            else console.log('✅ Product Stock Updated to:', newStock);
        }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseAdmin.from('products').delete().in('id', [serviceId, productId]);
    // Note: movements cascade delete usually, or we leave them as orphans for now
}

testDirectMovementLogic();
