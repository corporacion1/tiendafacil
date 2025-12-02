// Test script to check products table schema
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductsSchema() {
    console.log('🔍 Testing products table schema...\n');

    const { data: existingData, error: selectError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('❌ Error selecting from products:', selectError);
        return;
    }

    if (existingData && existingData.length > 0) {
        const product = existingData[0];
        console.log('✅ Sample product keys:', Object.keys(product).sort());
        console.log('   tax1:', product.tax1);
        console.log('   tax2:', product.tax2);
        console.log('   affects_inventory:', product.affects_inventory);
    } else {
        console.log('⚠️ No products found to check schema');
    }
}

testProductsSchema().catch(console.error);
