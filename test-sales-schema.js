
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

async function checkSalesSchema() {
    console.log('Checking sales table schema...');
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .limit(1);

    if (salesError) {
        console.error('Error fetching sales:', salesError);
    } else if (sales.length > 0) {
        console.log('Sales table columns:', Object.keys(sales[0]));
    } else {
        console.log('Sales table is empty.');
    }
}

checkSalesSchema();
