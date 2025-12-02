const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testServiceMovement() {
    console.log('🚀 Starting Service Movement Test...');

    // 1. Get a valid store
    const { data: store } = await supabase.from('stores').select('id').limit(1).single();
    if (!store) { console.error('❌ No store found'); return; }
    const storeId = store.id;
    console.log(`📍 Using Store ID: ${storeId}`);

    // 2. Create Test Products
    const serviceId = `TEST-SERV-${Date.now()}`;
    const productId = `TEST-PROD-${Date.now()}`;

    // Create Service
    await supabase.from('products').insert({
        id: serviceId,
        name: 'Test Service Item',
        type: 'service',
        price: 100,
        cost: 0,
        stock: 0,
        affects_inventory: false,
        store_id: storeId
    });

    // Create Product
    await supabase.from('products').insert({
        id: productId,
        name: 'Test Physical Product',
        type: 'product',
        price: 200,
        cost: 100,
        stock: 10,
        affects_inventory: true,
        store_id: storeId
    });

    console.log('✅ Created test items:');
    console.log(`   - Service: ${serviceId}`);
    console.log(`   - Product: ${productId} (Stock: 10)`);

    // 3. Simulate Sale (Call the API logic directly or simulate via DB insert + Service call? 
    // Since we can't easily import TS service in JS script, we'll hit the API if running, 
    // OR just manually insert to sales and see if triggers work? 
    // Wait, the logic is in the API route, not a DB trigger. 
    // So we need to hit the API endpoint.

    // Actually, for this standalone script, we can't easily hit the running localhost API 
    // without assuming port 3000. Let's try to fetch localhost:3000.

    const salePayload = {
        storeId: storeId,
        items: [
            { productId: serviceId, productName: 'Test Service Item', quantity: 1, price: 100 },
            { productId: productId, productName: 'Test Physical Product', quantity: 2, price: 200 }
        ],
        total: 500,
        paymentMethod: 'cash'
    };

    console.log('\n🛒 Sending Sale Request to API...');
    try {
        const response = await fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salePayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ API Error:', result);
            throw new Error('API request failed');
        }

        console.log('✅ Sale created:', result.id);
        const saleId = result.id;

        // 4. Verify Inventory Movements
        console.log('\n🔍 Verifying Inventory Movements...');

        // Check Service Movement
        const { data: servMovs } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('reference_id', saleId)
            .eq('product_id', serviceId);

        if (servMovs && servMovs.length > 0) {
            console.log('✅ Service Movement FOUND (Correct):');
            console.log(`   - Qty: ${servMovs[0].quantity}`);
            console.log(`   - New Stock: ${servMovs[0].new_stock} (Should be 0)`);
            console.log(`   - Notes: ${servMovs[0].notes}`);
        } else {
            console.error('❌ Service Movement NOT found!');
        }

        // Check Product Movement
        const { data: prodMovs } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('reference_id', saleId)
            .eq('product_id', productId);

        if (prodMovs && prodMovs.length > 0) {
            console.log('✅ Product Movement FOUND (Correct):');
            console.log(`   - Qty: ${prodMovs[0].quantity} (Should be -2)`);
            console.log(`   - New Stock: ${prodMovs[0].new_stock} (Should be 8)`);
        } else {
            console.error('❌ Product Movement NOT found!');
        }

        // 5. Verify Final Stock in Products Table
        console.log('\n🔍 Verifying Final Stock...');

        const { data: finalService } = await supabase.from('products').select('stock').eq('id', serviceId).single();
        const { data: finalProduct } = await supabase.from('products').select('stock').eq('id', productId).single();

        console.log(`   - Service Stock: ${finalService.stock} (Expected: 0)`);
        console.log(`   - Product Stock: ${finalProduct.stock} (Expected: 8)`);

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('inventory_movements').delete().eq('reference_id', saleId);
        await supabase.from('sales').delete().eq('id', saleId);
        await supabase.from('products').delete().in('id', [serviceId, productId]);
        console.log('✅ Cleanup complete');

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        // Try cleanup anyway
        await supabase.from('products').delete().in('id', [serviceId, productId]);
    }
}

testServiceMovement();
