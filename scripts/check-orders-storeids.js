/**
 * Verificar orders en la base de datos
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrders() {
  try {
    console.log('🔍 Buscando orders en la base de datos...\n');

    // Buscar todas las orders para ver los storeIds disponibles
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('store_id, order_id, customer_name, customer_phone, processed_by, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching orders:', allError);
      process.exit(1);
    }

    console.log('='.repeat(80));
    console.log('📋 ORDERS RECIENTES - TODOS LOS STORES:');
    console.log('='.repeat(80));

    if (!allOrders || allOrders.length === 0) {
      console.log('⚠️ No hay orders en la base de datos');
      process.exit(0);
    }

    // Mostrar orders con sus storeIds
    const storeIds = new Set();
    allOrders.forEach((order, index) => {
      storeIds.add(order.store_id);
      console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
      console.log(`   Store ID: ${order.store_id}`);
      console.log(`   Customer: ${order.customer_name} - ${order.customer_phone}`);
      console.log(`   Processed By: ${order.processed_by || 'NULL'}`);
      console.log(`   Status: ${order.status}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📍 STORE IDS DISPONIBLES:');
    console.log('='.repeat(80));
    storeIds.forEach(storeId => {
      console.log(`  • ${storeId}`);
    });

    console.log('\n' + '='.repeat(80));

    // Ahora buscar orders para storeId específico
    const targetStoreId = 'ST-1234567890123';
    console.log(`\n🔍 Buscando orders específicamente para store: ${targetStoreId}`);

    const { data: storeOrders, error: storeError } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', targetStoreId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (storeError) {
      console.error('❌ Error fetching store orders:', storeError);
      process.exit(1);
    }

    console.log('='.repeat(80));
    console.log(`📊 ORDERS PARA STORE ${targetStoreId}:`);
    console.log('='.repeat(80));

    if (!storeOrders || storeOrders.length === 0) {
      console.log(`⚠️ No hay orders para el store ${targetStoreId}`);
      console.log(`\n💡 Puede que necesites usar uno de estos storeIds:`);
      storeIds.forEach(storeId => console.log(`  • ${storeId}`));
      process.exit(0);
    }

    storeOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
      console.log('   Campos críticos:');
      console.log(`     customer_name  = ${JSON.stringify(order.customer_name)}`);
      console.log(`     customer_phone = ${JSON.stringify(order.customer_phone)}`);
      console.log(`     processed_by   = ${JSON.stringify(order.processed_by)}`);
      console.log(`     user_id        = ${JSON.stringify(order.user_id)}`);
      console.log(`   Status: ${order.status}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verificación completada');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrders();
