const { Pool } = require('pg');

const NEON_URL = "postgresql://neondb_owner:npg_eP4vTAYZJE5g@ep-long-sea-aebyx8rz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const LOCAL_URL = "postgresql://postgres:19a1e3ef@localhost:5432/tiendafacil";

async function migrate() {
  const neonPool = new Pool({ connectionString: NEON_URL });
  const localPool = new Pool({ connectionString: LOCAL_URL });

  try {
    console.log('🚀 Iniciando migración de Neon a Local...');

    // 1. Obtener todas las tablas
    const tablesRes = await neonPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    console.log(`📦 Se encontraron ${tables.length} tablas.`);

    for (const table of tables) {
      console.log(`⏳ Migrando tabla: ${table}...`);

      // 2. Obtener esquema de la tabla (columnas y tipos)
      // Nota: Esto es una simplificación. No maneja constraints complejas ni índices.
      // Pero para datos básicos suele funcionar.
      const columnsRes = await neonPool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);

      const columns = columnsRes.rows;
      const createColumns = columns.map(c => {
        let def = `${c.column_name} ${c.data_type}`;
        if (c.is_nullable === 'NO') def += ' NOT NULL';
        // if (c.column_default) def += ` DEFAULT ${c.column_default}`; // Esto puede fallar si usa funciones de neon
        return def;
      }).join(', ');

      // 3. Crear tabla en local (si no existe)
      await localPool.query(`CREATE TABLE IF NOT EXISTS ${table} (${createColumns})`);

      // 4. Obtener datos
      const dataRes = await neonPool.query(`SELECT * FROM ${table}`);
      const rows = dataRes.rows;

      if (rows.length > 0) {
        const keys = Object.keys(rows[0]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = keys.map(k => row[k]);
          await localPool.query(insertQuery, values);
        }
        console.log(`✅ ${table}: ${rows.length} filas migradas.`);
      } else {
        console.log(`ℹ️ ${table}: Vacía.`);
      }
    }

    console.log('🎉 Migración completada con éxito!');
  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    await neonPool.end();
    await localPool.end();
  }
}

migrate();
