/**
 * Script para limpiar estatus de órdenes en la base de datos
 * Elimina espacios extra y normaliza a lowercase
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Normalizar un estatus: lowercase y trim
 */
function normalizeStatus(status) {
  if (!status) return 'pending';
  return status.toString().toLowerCase().trim();
}

/**
 * Validar estatus normalizado
 */
function isValidStatus(status) {
  const validStatuses = ['pending', 'processing', 'processed', 'cancelled', 'expired'];
  return validStatuses.includes(status);
}

async function cleanOrderStatuses() {
  try {
    console.log('🔍 Buscando órdenes con estatus a limpiar...\n');

    // Buscar todas las órdenes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id, status, customer_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders:', error);
      process.exit(1);
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found in database');
      process.exit(0);
    }

    console.log(`📊 Total de órdenes encontradas: ${orders.length}\n`);

    // Identificar órdenes con estatus sucios
    const dirtyOrders = orders.filter(order => {
      const originalStatus = order.status || '';
      const normalizedStatus = normalizeStatus(originalStatus);
      return originalStatus !== normalizedStatus || !isValidStatus(normalizedStatus);
    });

    if (dirtyOrders.length === 0) {
      console.log('✅ No se encontraron órdenes con estatus sucios. Todos los estatus están normalizados.');
      process.exit(0);
    }

    console.log(`🧹 Encontradas ${dirtyOrders.length} órdenes con estatus sucios:\n`);
    console.log('='.repeat(80));

    dirtyOrders.forEach(order => {
      const originalStatus = JSON.stringify(order.status || '');
      const normalizedStatus = normalizeStatus(order.status);
      const isValid = isValidStatus(normalizedStatus);
      const icon = isValid ? '⚠️' : '❌';

      console.log(`${icon} ${order.order_id}`);
      console.log(`   Cliente: ${order.customer_name}`);
      console.log(`   Original: ${originalStatus}`);
      console.log(`   Normalizado: "${normalizedStatus}"`);
      console.log(`   Válido: ${isValid ? '✅' : '❌'}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('\n🔄 Procediendo a limpiar los estatus...\n');

    // Limpiar cada orden
    let successCount = 0;
    let errorCount = 0;

    for (const order of dirtyOrders) {
      const normalizedStatus = normalizeStatus(order.status);

      // Solo limpiar si es un estatus válido
      if (!isValidStatus(normalizedStatus)) {
        console.log(`⚠️ Skipping ${order.order_id} - estatus "${normalizedStatus}" no es válido`);
        continue;
      }

      try {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: normalizedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', order.order_id);

        if (updateError) {
          console.error(`❌ Error actualizando ${order.order_id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ ${order.order_id}: "${order.status}" → "${normalizedStatus}"`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error actualizando ${order.order_id}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(80));
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Fallidas: ${errorCount}`);
    console.log(`📊 Total: ${dirtyOrders.length}`);
    console.log('='.repeat(80));

    if (successCount > 0) {
      console.log('\n🎉 Limpieza completada exitosamente!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️ No se pudo limpiar ninguna orden.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanOrderStatuses();
