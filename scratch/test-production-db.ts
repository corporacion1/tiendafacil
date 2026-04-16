import { neon } from '@neondatabase/serverless';

async function testConnection() {
  const url = 'postgresql://neondb_owner:npg_eP4vTAYZJE5g@ep-long-sea-aebyx8rz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  console.log('🔗 Testing connection to NEW URL:', url);
  
  try {
    const sql = neon(url);
    const result = await sql`SELECT current_database(), current_user`;
    console.log('✅ Success! Connected to:', result);
    
    // Check tables
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables found:', tables.map((t: any) => t.table_name).join(', '));
    
    // Check rows in products if exists
    if (tables.some((t: any) => t.table_name === 'products')) {
        const count = await sql`SELECT COUNT(*) FROM products`;
        console.log('Product count:', count[0].count);
    }

  } catch (e: any) {
    console.error('❌ Connection failed:', e.message);
  }
}

testConnection();
