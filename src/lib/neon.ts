// src/lib/neon.ts
import { neon } from '@neondatabase/serverless';

// Exported as a getter to avoid throwing at module load time on the client
let _sql: any;

export const getSql = () => {
  // Silent fail on client during module load/discovery
  if (typeof window !== 'undefined') {
    return () => { throw new Error('Neon database client cannot be used on the client side'); };
  }
  
  if (!process.env.DATABASE_URL) {
    // Return a dummy function instead of throwing to prevent build/init crashes
    console.warn('⚠️ [Neon] DATABASE_URL is not defined. Queries will fail.');
    return () => { throw new Error('DATABASE_URL is not defined in environment variables'); };
  }

  if (!_sql) {
    try {
      _sql = neon(process.env.DATABASE_URL);
    } catch (e) {
      console.error('❌ [Neon] Error initializing client:', e);
      return () => { throw e; };
    }
  }
  return _sql;
};

// Proxy to allow using it as sql`query` or sql(query, params)
// We only invoke getSql() when the proxy is actually used/called
export const sql = new Proxy(() => {}, {
  apply: (target, thisArg, argArray) => {
    return getSql()(...argArray);
  },
  get: (target, prop) => {
    // Avoid triggering getSql() for common JS/internal properties
    if (prop === '$$typeof' || prop === 'constructor' || prop === 'prototype' || typeof prop === 'symbol') {
      return undefined;
    }
    const s = getSql();
    return s[prop];
  }
});

/**
 * Executes a SQL query using Neon.
 */
export async function query<T>(queryStr: string, params: any[] = []): Promise<T[]> {
  if (typeof window !== 'undefined') {
    throw new Error('Neon queries cannot be executed on the client side');
  }
  
  try {
    const s = getSql();
    const result = await s(queryStr, params);
    return result as T[];
  } catch (error) {
    console.error('Neon Query Error:', error);
    throw error;
  }
}
