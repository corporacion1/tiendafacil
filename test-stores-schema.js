
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

async function checkSchema() {
    console.log('Checking stores table schema...');
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .limit(1);

    if (storesError) {
        console.error('Error fetching stores:', storesError);
    } else if (stores.length > 0) {
        console.log('Stores table columns:', Object.keys(stores[0]));
    } else {
        console.log('Stores table is empty, cannot determine columns from data.');
        // Try to insert a dummy to see error or success if needed, but let's rely on error message if column doesn't exist
    }

    console.log('\nChecking users table schema...');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (usersError) {
        console.error('Error fetching users:', usersError);
    } else if (users.length > 0) {
        console.log('Users table columns:', Object.keys(users[0]));
    } else {
        console.log('Users table is empty.');
    }
}

checkSchema();
