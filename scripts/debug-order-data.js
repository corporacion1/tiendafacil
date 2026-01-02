/**
 * Debug script para ver datos completos de órdenes
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOrderData() {
  try {
    console.log('🔍 Obteniendo datos completos de órdenes...\n');

    // Buscar todas las órdenes con todos los campos
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Error fetching orders:', error);
      process.exit(1);
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found in database');
      process.exit(0);
    }

    console.log(`📊 Total de órdenes encontradas: ${orders.length}\n`);

    // Mostrar todos los campos de la primera orden
    console.log('='.repeat(80));
    console.log('📋 PRIMERA ORDEN - TODOS LOS CAMPOS:');
    console.log('='.repeat(80));
    const firstOrder = orders[0];
    Object.keys(firstOrder).forEach(key => {
      const value = firstOrder[key];
      const type = typeof value;
      const displayValue = type === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value;
      console.log(`  ${key.padEnd(30)} = ${JSON.stringify(displayValue)} (${type})`);
    });
    console.log('='.repeat(80));

    // Verificar campos específicos que el usuario menciona
    console.log('\n🔍 CAMPOS ESPECÍFICOS SOLICITADOS:');
    console.log('='.repeat(80));
    console.log(`customer_name  = ${JSON.stringify(firstOrder.customer_name || 'MISSING')}`);
    console.log(`customer_phone = ${JSON.stringify(firstOrder.customer_phone || 'MISSING')}`);
    console.log(`user_id       = ${JSON.stringify(firstOrder.user_id || 'MISSING')} (processedBy)`);
    console.log(`processed_by  = ${JSON.stringify(firstOrder.processed_by || 'MISSING')} (campo alternativo)`);
    console.log('='.repeat(80));

    // Verificar si existe processed_by en la tabla
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders' })
      .catch(() => null);

    if (!columnsError && columns) {
      const relevantColumns = columns.filter(col =>
        col.column_name === 'customer_name' ||
        col.column_name === 'customer_phone' ||
        col.column_name === 'user_id' ||
        col.column_name === 'processed_by'
      );
      console.log('\n📋 COLUMNAS EN TABLA orders:');
      console.log('='.repeat(80));
      relevantColumns.forEach(col => {
        console.log(`  ${col.column_name.padEnd(20)} | ${col.is_nullable ? 'NULLABLE' : 'NOT NULL'} | ${col.data_type.padEnd(15)}`);
      });
      console.log('='.repeat(80));
    }

    console.log('\n✅ Debug completado\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugOrderData();
