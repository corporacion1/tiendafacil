/**
 * Debug script para ver estatus de órdenes en la base de datos
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOrderStatuses() {
  try {
    console.log('🔍 Buscando todos los estatus de órdenes en la base de datos...\n');

    // Buscar todas las órdenes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id, status, customer_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching orders:', error);
      process.exit(1);
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found in database');
      process.exit(0);
    }

    console.log(`📊 Total de órdenes encontradas: ${orders.length}\n`);

    // Agrupar por estatus
    const statusGroups = {};
    const uniqueStatuses = new Set();

    orders.forEach(order => {
      const status = order.status || 'NULL';
      uniqueStatuses.add(status);

      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(order);
    });

    console.log('📋 ESTATUS ÚNICOS ENCONTRADOS:');
    console.log('='.repeat(50));
    uniqueStatuses.forEach(status => {
      console.log(`  • ${JSON.stringify(status)}`);
    });
    console.log('='.repeat(50));
    console.log('\n');

    // Mostrar distribución por estatus
    console.log('📊 DISTRIBUCIÓN POR ESTATUS:');
    console.log('='.repeat(50));
    Object.keys(statusGroups).sort().forEach(status => {
      const count = statusGroups[status].length;
      const bar = '█'.repeat(Math.ceil(count / 2));
      console.log(`  ${status.padEnd(15)} ${bar} (${count})`);
    });
    console.log('='.repeat(50));
    console.log('\n');

    // Mostrar órdenes recientes
    console.log('📝 ÓRDENES RECIENTES:');
    console.log('='.repeat(50));
    orders.slice(0, 10).forEach((order, index) => {
      const status = order.status || 'NULL';
      const displayStatus = JSON.stringify(status);
      console.log(`${index + 1}. ${order.order_id}`);
      console.log(`   Cliente: ${order.customer_name}`);
      console.log(`   Status: ${displayStatus} (tipo: ${typeof status})`);
      console.log(`   Fecha: ${order.created_at}`);
      console.log('');
    });
    console.log('='.repeat(50));

    console.log('\n✅ Debug completado\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugOrderStatuses();
