
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

async function checkSalesConstraints() {
    console.log('Checking customers table...');
    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(5);

    if (customersError) {
        console.error('Error fetching customers:', customersError);
    } else {
        console.log('Found customers:', customers.length);
        if (customers.length > 0) {
            console.log('Sample customer:', customers[0]);
        }
    }

    console.log('\nChecking if "Anonymous" or default customer exists...');
    // Check for common default IDs or names
    const { data: defaultCustomer, error: defaultError } = await supabase
        .from('customers')
        .select('*')
        .or('id.eq.0,name.ilike.General,name.ilike.Anonimo,name.ilike.Consumidor Final')
        .limit(1);

    if (defaultError) {
        console.error('Error checking default customer:', defaultError);
    } else {
        console.log('Default customer search result:', defaultCustomer);
    }
}

checkSalesConstraints();
