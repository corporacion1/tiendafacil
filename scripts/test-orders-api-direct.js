/**
 * Test directo a la API de orders para ver qué datos devuelve
 */
const http = require('http');

async function testOrdersAPIDirect() {
  const storeId = 'ST-1234567890123'; // Store ID de prueba

  console.log('🔍 Probando API de orders directamente...');
  console.log(`📍 URL: http://localhost:3000/api/orders?storeId=${storeId}&noCache=true\n`);

  try {
    const response = await fetch(`http://localhost:3000/api/orders?storeId=${storeId}&noCache=true`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('='.repeat(80));
    console.log('📋 TIPO DE DATOS RECIBIDOS:');
    console.log('='.repeat(80));
    console.log('  typeof data =', typeof data);
    console.log('  Array.isArray(data) =', Array.isArray(data));
    console.log('  data.length =', data.length);
    console.log('='.repeat(80));

    if (data.length === 0) {
      console.log('\n⚠️ No hay pedidos para mostrar');
      process.exit(0);
    }

    // Mostrar primer pedido completo
    const firstOrder = data[0];

    console.log('\n📝 PRIMER PEDIDO - TODOS LOS CAMPOS:');
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
    console.log('🔍 CAMPOS CRÍTICOS (lo que necesita Reports):');
    console.log('='.repeat(80));

    // Verificar campos de todas las formas posibles
    console.log('\n👤 CUSTOMER_NAME:');
    console.log(`  order.customer_name  = ${JSON.stringify(firstOrder.customer_name)}`);
    console.log(`  order.customerName  = ${JSON.stringify(firstOrder.customerName)}`);
    console.log(`  → Usará: ${firstOrder.customer_name || firstOrder.customerName || 'CLIENTE NO ESPECIFICADO'}`);

    console.log('\n📞 CUSTOMER_PHONE:');
    console.log(`  order.customer_phone = ${JSON.stringify(firstOrder.customer_phone)}`);
    console.log(`  order.customerPhone = ${JSON.stringify(firstOrder.customerPhone)}`);
    console.log(`  → Usará: ${firstOrder.customer_phone || firstOrder.customerPhone || ''}`);

    console.log('\n👨‍💼 PROCESSED_BY:');
    console.log(`  order.processed_by  = ${JSON.stringify(firstOrder.processed_by)}`);
    console.log(`  order.processedBy  = ${JSON.stringify(firstOrder.processedBy)}`);
    console.log(`  order.user_id      = ${JSON.stringify(firstOrder.user_id)}`);
    console.log(`  → Usará: ${firstOrder.processedBy || firstOrder.user_id || ''}`);

    console.log('\n' + '='.repeat(80));

    // Comparar con DB
    console.log('\n📊 COMPARACIÓN CON DATOS DE LA BASE DE DATOS:');
    console.log('='.repeat(80));
    console.log('DB esperado: customer_name = "Jorge Negrete"');
    console.log(`API devolvió: order.customer_name  = ${JSON.stringify(firstOrder.customer_name)}`);
    console.log(`API devolvió: order.customerName  = ${JSON.stringify(firstOrder.customerName)}`);
    console.log('');
    console.log('DB esperado: customer_phone = "04146441250"');
    console.log(`API devolvió: order.customer_phone = ${JSON.stringify(firstOrder.customer_phone)}`);
    console.log(`API devolvió: order.customerPhone = ${JSON.stringify(firstOrder.customerPhone)}`);
    console.log('');
    console.log('DB esperado: processed_by = "Jorge Negrete"');
    console.log(`API devolvió: order.processed_by  = ${JSON.stringify(firstOrder.processed_by)}`);
    console.log(`API devolvió: order.processedBy  = ${JSON.stringify(firstOrder.processedBy)}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Nota: El servidor de Next.js debe estar corriendo (npm run dev)');
    process.exit(1);
  }
}

testOrdersAPIDirect();
