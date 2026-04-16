import { sql } from '../src/lib/neon';

async function check() {
  console.log('🔍 Checking stores and product store_ids...');
  try {
    const stores = await sql`SELECT id, name FROM stores`;
    console.log('Stores in DB:', stores);

    const productStores = await sql`SELECT DISTINCT store_id FROM products`;
    console.log('Unique store_ids in products:', productStores);

  } catch (error) {
    console.error('Error checking DB:', error);
  }
}

check();
