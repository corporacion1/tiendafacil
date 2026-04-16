import { sql } from '../src/lib/neon';

async function updateSchema() {
  console.log('🔄 Updating schema to include missing tables...');
  try {
    // Units
    await sql`
      CREATE TABLE IF NOT EXISTS units (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        store_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table units created');

    // Families
    await sql`
      CREATE TABLE IF NOT EXISTS families (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        store_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table families created');

    // Warehouses
    await sql`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location TEXT,
        store_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table warehouses created');

    // Currency Rates
    await sql`
      CREATE TABLE IF NOT EXISTS currency_rates (
        id VARCHAR(255) PRIMARY KEY,
        rate NUMERIC(15, 6) NOT NULL,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        store_id VARCHAR(255) NOT NULL,
        created_by VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table currency_rates created');

  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

updateSchema();
