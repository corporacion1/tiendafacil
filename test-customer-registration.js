const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCustomerRegistration() {
    console.log('Checking customers table schema...');

    // Check if customers table exists and get its structure
    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

    if (customersError) {
        console.error('❌ Error accessing customers table:', customersError);
        return;
    }

    if (customers.length > 0) {
        console.log('✅ Customers table exists');
        console.log('Sample customer columns:', Object.keys(customers[0]));
    } else {
        console.log('⚠️ Customers table is empty');
    }

    // Test insert (will rollback)
    console.log('\nTesting customer insert...');
    const testCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        store_id: 'test-store-id',
        created_at: new Date().toISOString()
    };

    const { data: insertedCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([testCustomer])
        .select()
        .single();

    if (insertError) {
        console.error('❌ Error inserting test customer:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error details:', insertError.details);
    } else {
        console.log('✅ Test customer inserted successfully');
        console.log('Inserted customer:', insertedCustomer);

        // Clean up test data
        await supabase
            .from('customers')
            .delete()
            .eq('id', insertedCustomer.id);
        console.log('✅ Test customer deleted');
    }
}

testCustomerRegistration();
