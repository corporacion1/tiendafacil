// src/lib/db.ts

// El pool de conexiones permite manejar múltiples consultas de forma eficiente
let pool: any = null;

export function getPool() {
  if (typeof window !== 'undefined') {
    return null; // Return null instead of throwing to avoid breaking client-side imports
  }

  if (!pool) {
    // Dynamic require to prevent bundling on the client
    const { Pool } = require('pg');
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn('⚠️ [DB] DATABASE_URL is not defined in process.env. Using default local connection on port 5433.');
    } else {
      const masked = connectionString.replace(/:([^:@]+)@/, ':****@');
      console.log('🔌 [DB] Connecting to database:', masked);
    }

    pool = new Pool({
      connectionString: connectionString || 'postgresql://postgres@localhost:5433/tiendafacil',
      // Configuraciones para entorno local
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Aumentado a 5s para mayor estabilidad
    });

    pool.on('error', (err: any) => {
      console.error('❌ [DB] Unexpected error on idle client', err);
    });

    // Probar la conexión inmediatamente
    pool.query('SELECT NOW()').then(() => {
      console.log('✅ [DB] Database connection established successfully');
    }).catch((err: any) => {
      console.error('❌ [DB] Failed to connect to database:', err.message);
    });
  }

  return pool;
}

/**
 * Ejecuta una consulta SQL en la base de datos local
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getPool();
  if (!p) {
    console.warn('⚠️ [DB] query() called on client-side. Returning empty array.');
    return [];
  }
  
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    const duration = Date.now() - start;
    
    // Log opcional para debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      // console.log('executed query', { text, duration, rows: res.rowCount });
    }
    
    return res.rows;
  } catch (error) {
    console.error('❌ [DB] Query Error:', error);
    throw error;
  }
}

/**
 * Ejecuta una consulta y devuelve el resultado completo de pg
 */
export async function fullQuery(text: string, params?: any[]): Promise<any> {
  const p = getPool();
  if (!p) {
     console.warn('⚠️ [DB] fullQuery() called on client-side. Returning empty object.');
     return { rows: [], rowCount: 0 };
  }
  return await p.query(text, params);
}
