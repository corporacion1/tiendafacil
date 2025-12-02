// Test script to verify the full POS flow
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const API_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('🚀 Starting End-to-End POS Flow Test...\n');

    const storeId = 'store_123';
    const userId = 'user_test';

    // 1. Create a Test Product
    console.log('📦 1. Creating Test Product...');
    const productId = `PROD-TEST-${Date.now()}`;

    const { data: product, error: prodError } = await supabase
        .from('products')
        .insert([{
            id: productId,
            name: 'Test Product ' + Date.now(),
            store_id: storeId,
            price: 100,
            cost: 50,
            stock: 10,
            affects_inventory: true,
            type: 'product'
        }])
        .select()
        .single();

    if (prodError) {
        console.error('❌ Failed to create test product:', prodError);
        return;
    }
    console.log('✅ Product created:', product.id);

    try {
        // 2. Open Cash Session
        console.log('\n💰 2. Opening Cash Session...');
        const sessionData = {
            id: `SES-TEST-${Date.now()}`,
            storeId,
            openingBalance: 1000,
            openedBy: 'Test User'
        };

        let sessionId;
        try {
            const res = await fetch(`${API_URL}/cashsessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
            if (!res.ok) throw new Error(await res.text());
            const session = await res.json();
            sessionId = session.id;
            console.log('✅ Session opened:', sessionId);
        } catch (e) {
            console.error('❌ Failed to open session (is server running?):', e.message);
            const { data: session } = await supabase
                .from('cash_sessions')
                .insert([{
                    id: sessionData.id,
                    store_id: storeId,
                    opening_balance: 1000,
                    opening_amount: 1000,
                    opened_by: 'Test User',
                    status: 'open',
                    opening_date: new Date().toISOString()
                }])
                .select()
                .single();
            sessionId = session.id;
            console.log('⚠️ Created session manually to continue:', sessionId);
        }

        // 3. Process Sale
        console.log('\n🛒 3. Processing Sale...');
        const saleData = {
            customerId: 'eventual',
            customerName: 'Cliente Eventual',
            items: [{
                productId: product.id,
                productName: product.name,
                quantity: 2,
                price: 100
            }],
            total: 200,
            storeId,
            userId,
            payments: [{ method: 'efectivo', amount: 200 }]
        };

        let saleId;
        try {
            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });
            if (!res.ok) throw new Error(await res.text());
            const sale = await res.json();
            saleId = sale.id;
            console.log('✅ Sale processed:', saleId);
        } catch (e) {
            console.error('❌ Failed to process sale:', e.message);
            throw e;
        }

        // 4. Verify Inventory Movement
        console.log('\n🔍 4. Verifying Inventory Movement...');
        await new Promise(r => setTimeout(r, 1000));

        const { data: movements, error: movError } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('reference_id', saleId);

        if (movError) console.error('❌ Error fetching movements:', movError);

        if (movements && movements.length > 0) {
            console.log('✅ Inventory movement found:', movements[0].id);
            console.log('   Quantity:', movements[0].quantity);
            console.log('   New Stock:', movements[0].new_stock);

            if (movements[0].quantity === -2 && movements[0].new_stock === 8) {
                console.log('✅ Stock calculation correct (-2 from 10 = 8)');
            } else {
                console.error('❌ Stock calculation incorrect!');
            }
        } else {
            console.error('❌ No inventory movement found for sale!');
        }

        // 5. Update Session (add sale)
        console.log('\n💰 5. Updating Session with Sale...');
        const { data: currentSession } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        const updatedSession = {
            ...currentSession,
            salesIds: [...(currentSession.sales_ids || []), saleId],
            transactions: {
                ...currentSession.transactions,
                efectivo: (currentSession.transactions?.efectivo || 0) + 200
            }
        };

        try {
            const res = await fetch(`${API_URL}/cashsessions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSession)
            });
            if (!res.ok) throw new Error(await res.text());
            console.log('✅ Session updated with sale');
        } catch (e) {
            console.error('❌ Failed to update session:', e.message);
        }

        // 6. Close Session
        console.log('\n🔒 6. Closing Session...');
        const closeData = {
            sessionId,
            storeId,
            closingBalance: 1200,
            closedBy: 'Test User'
        };

        try {
            const res = await fetch(`${API_URL}/cashsessions/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(closeData)
            });
            if (!res.ok) throw new Error(await res.text());
            const report = await res.json();
            console.log('✅ Session closed successfully');
            console.log('   Difference:', report.session.difference);

            if (report.session.status === 'closed' && report.session.difference === 0) {
                console.log('✅ Session status and difference correct');
            } else {
                console.error('❌ Session verification failed:', report.session);
            }
        } catch (e) {
            console.error('❌ Failed to close session:', e.message);
        }

    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        console.log('\n🧹 Cleaning up...');
        await supabase.from('products').delete().eq('id', product.id);
        console.log('✨ Test Complete');
    }
}

runTest();
