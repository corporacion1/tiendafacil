import { sql } from '../src/lib/neon';

async function check() {
  console.log('🔍 Checking users...');
  try {
    const users = await sql`SELECT email, role, store_id FROM users`;
    console.log('Users in DB:', users);
  } catch (error) {
    console.error('Error checking DB:', error);
  }
}

check();
