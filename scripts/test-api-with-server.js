/**
 * Test script para verificar datos de la API con el servidor corriendo
 * Para ejecutar: npm run dev (en una terminal)
 * Luego: node scripts/test-api-with-server.js (en otra terminal)
 */

const storeId = 'ST-1234567890123';

console.log('🔍 Probando API de orders con servidor corriendo...');
console.log(`📍 Store ID: ${storeId}`);
console.log('⚠️  Nota: El servidor debe estar corriendo (npm run dev)\n');

fetch(`http://localhost:3000/api/orders?storeId=${storeId}&noCache=true`)
  .then(response => {
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);
    if (!response.ok) {
      throw new Error('API response not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('='.repeat(80));
    console.log('📋 DATOS RECIBIDOS DE LA API:');
    console.log('='.repeat(80));
    console.log(`  Tipo de datos: ${Array.isArray(data) ? 'Array' : typeof data}`);
    console.log(`  Cantidad: ${Array.isArray(data) ? data.length : 1}`);
    console.log('='.repeat(80));

    if (!Array.isArray(data) || data.length === 0) {
      console.log('\n⚠️ No se recibieron orders');
      return;
    }

    // Mostrar primera order completa
    const firstOrder = data[0];

    console.log('\n📝 PRIMERA ORDER - TODOS LOS CAMPOS:');
    console.log('='.repeat(80));
    Object.keys(firstOrder).forEach(key => {
      const value = firstOrder[key];
      const type = typeof value;
      const displayValue = type === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value;
      console.log(`  ${key.padEnd(25)} = ${JSON.stringify(displayValue)} (${type})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 CAMPOS CRÍTICOS:');
    console.log('='.repeat(80));

    console.log('\n👤 CUSTOMER:');
    console.log(`  customer_name  = ${JSON.stringify(firstOrder.customer_name)}`);
    console.log(`  customerName  = ${JSON.stringify(firstOrder.customerName)}`);
    console.log(`  → El frontend usará: ${firstOrder.customer_name || firstOrder.customerName || 'CLIENTE NO ESPECIFICADO'}`);

    console.log('\n📞 PHONE:');
    console.log(`  customer_phone = ${JSON.stringify(firstOrder.customer_phone)}`);
    console.log(`  customerPhone = ${JSON.stringify(firstOrder.customerPhone)}`);
    console.log(`  → El frontend usará: ${firstOrder.customer_phone || firstOrder.customerPhone || ''}`);

    console.log('\n👨‍💼 PROCESSED BY:');
    console.log(`  processed_by  = ${JSON.stringify(firstOrder.processed_by)}`);
    console.log(`  processedBy  = ${JSON.stringify(firstOrder.processedBy)}`);
    console.log(`  user_id       = ${JSON.stringify(firstOrder.user_id)}`);
    console.log(`  → El frontend usará: ${firstOrder.processedBy || firstOrder.user_id || ''}`);

    console.log('\n' + '='.repeat(80));

    // Comparación
    console.log('\n📊 COMPARACIÓN DB vs API:');
    console.log('='.repeat(80));
    console.log('DB: customer_name = "Jorge Negrete"');
    console.log(`API: order.customer_name  = ${JSON.stringify(firstOrder.customer_name)}`);
    console.log(`API: order.customerName  = ${JSON.stringify(firstOrder.customerName)}`);
    console.log('');
    console.log('DB: customer_phone = "04146441250"');
    console.log(`API: order.customer_phone = ${JSON.stringify(firstOrder.customer_phone)}`);
    console.log(`API: order.customerPhone = ${JSON.stringify(firstOrder.customerPhone)}`);
    console.log('');
    console.log('DB: processed_by = "Jorge Negrete"');
    console.log(`API: order.processed_by  = ${JSON.stringify(firstOrder.processed_by)}`);
    console.log(`API: order.processedBy  = ${JSON.stringify(firstOrder.processedBy)}`);
    console.log('='.repeat(80));

  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo (npm run dev)');
  });
