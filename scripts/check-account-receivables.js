/**
 * Script para verificar la estructura de la tabla account_receivables
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccountReceivablesTable() {
  try {
    console.log('🔍 Verificando estructura de la tabla account_receivables...\n');

    // Intentar consultar la tabla
    const { data, error, count } = await supabase
      .from('account_receivables')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error al consultar account_receivables:', error);
      console.error('\nDetalles del error:');
      console.error('  Código:', error.code);
      console.error('  Mensaje:', error.message);
      console.error('  Detalles:', error.details);
      console.error('\n📝 Esto indica que la tabla puede no existir o no tener permisos');
      process.exit(1);
    }

    console.log('✅ Tabla account_receivables encontrada');
    console.log(`📊 Total de registros: ${count || 0}\n`);

    // Si hay registros, mostrar el primero para ver estructura
    if (count && count > 0) {
      console.log('📋 EJEMPLO DE REGISTRO:');
      console.log('='.repeat(80));
      const { data: sampleData } = await supabase
        .from('account_receivables')
        .select('*')
        .limit(1);

      if (sampleData && sampleData.length > 0) {
        const sample = sampleData[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          const displayValue = type === 'string' && value.length > 50
            ? value.substring(0, 50) + '...'
            : value;
          console.log(`  ${key.padEnd(30)} = ${JSON.stringify(displayValue)} (${type})`);
        });
      }
      console.log('='.repeat(80));
    } else {
      console.log('⚠️ La tabla está vacía. No hay cuentas por cobrar registradas.');
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAccountReceivablesTable();
