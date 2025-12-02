// Test script to check if cash_sessions table exists and has correct schema
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

async function testCashSessions() {
    console.log('🔍 Testing cash_sessions table...\n');

    // 1. Check if table exists by trying to select from it
    console.log('1. Checking if table exists...');
    const { data: existingData, error: selectError } = await supabase
        .from('cash_sessions')
        .select('*')
        .limit(5);

    if (selectError) {
        console.error('❌ Error selecting from cash_sessions:', selectError);
        console.error('   This might mean the table doesn\'t exist or has permission issues');
        return;
    }

    console.log(`✅ Table exists! Found ${existingData?.length || 0} existing records`);
    if (existingData && existingData.length > 0) {
        console.log('   Sample record:', JSON.stringify(existingData[0], null, 2));
    }

    // 2. Try to insert a test record with all expected fields
    console.log('\n2. Attempting to insert a test record...');
    const testRecord = {
        store_id: 'test-store',
        opening_date: new Date().toISOString(),
        opening_balance: 100,
        status: 'open',
        opened_by: 'test-user',
        sales_ids: [],
        transactions: {},
        calculated_cash: 0,
        difference: 0
    };

    const { data: insertedData, error: insertError } = await supabase
        .from('cash_sessions')
        .insert([testRecord])
        .select()
        .single();

    if (insertError) {
        console.error('❌ Error inserting test record:', insertError);
        console.error('   Error code:', insertError.code);
        console.error('   Error message:', insertError.message);
        console.error('   Error details:', insertError.details);
        return;
    }

    console.log('✅ Successfully inserted test record!');
    console.log('   Record ID:', insertedData.id);

    // 3. Clean up - delete the test record
    console.log('\n3. Cleaning up test record...');
    const { error: deleteError } = await supabase
        .from('cash_sessions')
        .delete()
        .eq('id', insertedData.id);

    if (deleteError) {
        console.error('⚠️  Could not delete test record:', deleteError);
    } else {
        console.log('✅ Test record cleaned up');
    }

    console.log('\n✅ All tests passed! The cash_sessions table is working correctly.');
}

testCashSessions().catch(console.error);
