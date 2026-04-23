// src/lib/PostgreSQL.ts
import { query as localQuery } from './db';

/**
 * Proxy para simular la sintaxis de DB sql`query` 
 * o sql(query, params) usando el cliente local pg.
 */
export const sql: any = async (queryStr: any, ...params: any[]) => {
  if (typeof window !== 'undefined') {
    throw new Error('Database queries cannot be executed on the client side');
  }

  // Si se usa como template tag: sql`SELECT...`
  if (Array.isArray(queryStr)) {
    let text = queryStr[0];
    for (let i = 1; i < queryStr.length; i++) {
        text += `$${i}${queryStr[i]}`;
    }
    return await localQuery(text, params);
  }
  
  // Si se usa como función: sql('SELECT...', [...])
  return await localQuery(queryStr, params[0] || []);
};

// Mantener compatibilidad con la función query exportada
export async function query<T>(queryStr: string, params: any[] = []): Promise<T[]> {
  return await localQuery<T>(queryStr, params);
}

