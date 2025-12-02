// Test script to check if inventory_movements table exists and can be written to
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInventoryMovements() {
    console.log('🔍 Testing inventory_movements table...\n');

    // 1. Check if table exists by trying to select from it
    console.log('1. Checking if table exists...');
    const { data: existingData, error: selectError } = await supabase
        .from('inventory_movements')
        .select('*')
        .limit(5);

    if (selectError) {
        console.error('❌ Error selecting from inventory_movements:', selectError);
        console.error('   This might mean the table doesn\'t exist or has permission issues');
        return;
    }

    console.log(`✅ Table exists! Found ${existingData?.length || 0} existing records`);
    if (existingData && existingData.length > 0) {
        console.log('   Sample record:', JSON.stringify(existingData[0], null, 2));
    }

    // 2. Try to insert a test record
    console.log('\n2. Attempting to insert a test record...');
    const testRecord = {
        product_id: 'test-product-123',
        warehouse_id: 'main',
        movement_type: 'SALE',
        quantity: -1,
        unit_cost: 10,
        total_value: 10,
        reference_type: 'SALE_TRANSACTION',
        reference_id: 'test-sale-123',
        previous_stock: 10,
        new_stock: 9,
        user_id: 'test-user',
        notes: 'Test movement from diagnostic script',
        store_id: 'test-store'
    };

    const { data: insertedData, error: insertError } = await supabase
        .from('inventory_movements')
        .insert([testRecord])
        .select()
        .single();

    if (insertError) {
        console.error('❌ Error inserting test record:', insertError);
        console.error('   Error code:', insertError.code);
        console.error('   Error message:', insertError.message);
        console.error('   Error details:', insertError.details);
        console.error('   Error hint:', insertError.hint);
        return;
    }

    console.log('✅ Successfully inserted test record!');
    console.log('   Record ID:', insertedData.id);

    // 3. Clean up - delete the test record
    console.log('\n3. Cleaning up test record...');
    const { error: deleteError } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('id', insertedData.id);

    if (deleteError) {
        console.error('⚠️  Could not delete test record:', deleteError);
    } else {
        console.log('✅ Test record cleaned up');
    }

    console.log('\n✅ All tests passed! The inventory_movements table is working correctly.');
}

testInventoryMovements().catch(console.error);
