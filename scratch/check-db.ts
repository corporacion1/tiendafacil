import { sql } from '../src/lib/neon';

async function check() {
  console.log('🔍 Checking Neon database contents...');
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Found tables:', tables.map((t: any) => t.table_name).join(', '));
    
    // We use sql.query for dynamic table names
    const queryFn = (sql as any).query || sql;

    for (const t of (tables as any)) {
      try {
        const result = await queryFn(`SELECT COUNT(*) as count FROM ${t.table_name}`);
        const count = result.rows ? result.rows[0].count : result[0].count;
        console.log(`- ${t.table_name}: ${count} rows`);
        
        if (t.table_name === 'stores') {
          const stores = await sql`SELECT id, name FROM stores`;
          console.log('  Stores found:', stores);
        }
      } catch (err) {
        console.error(`  Error counting ${t.table_name}`);
      }
    }
  } catch (error) {
    console.error('Error checking DB:', error);
  }
}

check();
