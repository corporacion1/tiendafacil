/**
 * Test script para verificar datos de orders desde la API
 */
const http = require('http');

async function testOrdersAPI() {
  const storeId = 'ST-1234567890123'; // ID de tienda de prueba

  console.log('🔍 Probando API de orders...');
  console.log(`📍 URL: http://localhost:3000/api/orders?storeId=${storeId}\n`);

  try {
    const response = await fetch(`http://localhost:3000/api/orders?storeId=${storeId}`);

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('='.repeat(80));
    console.log('📋 TOTAL DE PEDIDOS:', data.length || data.accounts?.length || data.data?.length || 0);
    console.log('='.repeat(80));

    // Obtener el primer pedido
    const orders = Array.isArray(data) ? data : (data.accounts || data.data || []);
    const firstOrder = orders[0];

    if (!firstOrder) {
      console.log('⚠️ No hay pedidos para mostrar');
      process.exit(0);
    }

    console.log('\n📝 PRIMER PEDIDO - TODOS LOS CAMPOS:');
    console.log('='.repeat(80));
    Object.keys(firstOrder).forEach(key => {
      const value = firstOrder[key];
      const type = typeof value;
      const displayValue = type === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value;
      console.log(`  ${key.padEnd(30)} = ${JSON.stringify(displayValue)} (${type})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 CAMPOS ESPECÍFICOS SOLICITADOS:');
    console.log('='.repeat(80));
    console.log(`customerName  = ${JSON.stringify(firstOrder.customerName || 'MISSING')}`);
    console.log(`customerPhone = ${JSON.stringify(firstOrder.customerPhone || 'MISSING')}`);
    console.log(`processedBy   = ${JSON.stringify(firstOrder.processedBy || 'MISSING')}`);
    console.log('='.repeat(80));

    // Mostrar datos de la base de datos para comparar
    console.log('\n📊 COMPARACIÓN CON BASE DE DATOS:');
    console.log('='.repeat(80));
    console.log('DB esperado: customer_name = "Jorge Negrete"');
    console.log(`API devolvió: customerName  = ${JSON.stringify(firstOrder.customerName)}`);
    console.log('');
    console.log('DB esperado: customer_phone = "04146441250"');
    console.log(`API devolvió: customerPhone = ${JSON.stringify(firstOrder.customerPhone)}`);
    console.log('');
    console.log('DB esperado: processed_by = "Jorge Negrete"');
    console.log(`API devolvió: processedBy   = ${JSON.stringify(firstOrder.processedBy)}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Nota: El servidor de Next.js debe estar corriendo (npm run dev)');
    process.exit(1);
  }
}

testOrdersAPI();
