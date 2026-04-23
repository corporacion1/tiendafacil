// src/lib/PostgreSQL-bridge.ts
import { query as localQuery } from './db';

/**
 * A bridge to mimic DB query builder for local PostgreSQL.
 */
class LocalQueryBuilder {
  private table: string;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private allowNoRows: boolean = false;
  private columns: string = '*';
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.columns = columns;
    if (this.action === 'select') {
      this.action = 'select';
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '=', value });
    }
    return this;
  }

  neq(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '<>', value });
    }
    return this;
  }

  gt(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '>', value });
    }
    return this;
  }

  gte(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '>=', value });
    }
    return this;
  }

  lt(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '<', value });
    }
    return this;
  }

  lte(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, operator: '<=', value });
    }
    return this;
  }

  in(column: string, values: any[]) {
    if (Array.isArray(values) && values.length > 0) {
      this.filters.push({ column, operator: 'IN', value: values });
    }
    return this;
  }

  not(column: string, operator: string, value: any) {
    const opMap: Record<string, string> = {
      'eq': '<>',
      'neq': '=',
      'gt': '<=',
      'gte': '<',
      'lt': '>=',
      'lte': '>',
      'in': 'NOT IN'
    };
    const mappedOp = opMap[operator] || operator;
    this.filters.push({ column, operator: mappedOp, value });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    this.allowNoRows = false;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    this.allowNoRows = true;
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'ILIKE', value: pattern.replace(/%/g, '%') });
    return this;
  }

  or(filter: string) {
    // Simplificación extrema: Database .or('id.eq.1,name.eq.foo')
    // Por ahora, solo lo ignoramos o intentamos parsear lo básico
    console.warn('⚠️ dbBridge: .or() is not fully implemented. Filter:', filter);
    return this;
  }

  upsert(data: any | any[]) {
    this.action = 'insert'; // PostgreSQL 'INSERT ... ON CONFLICT' logic
    this.payload = data;
    return this;
  }

  async execute() {
    // Si estamos en el cliente, usamos el API bridge
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/db/bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: this.table,
            action: this.action,
            columns: this.columns,
            filters: this.filters,
            orderBy: this.orderBy,
            limit: this.limitCount,
            payload: this.payload
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData.error || { message: `HTTP Error ${response.status}` } };
        }

        const result = await response.json();
        
        // Ajuste para .single() o .maybeSingle()
        if (this.isSingle && Array.isArray(result.data)) {
           return { data: result.data[0] || null, error: result.error };
        }
        
        return result;
      } catch (error: any) {
        console.error('❌ dbBridge (Client):', error);
        return { data: null, error: { message: error.message } };
      }
    }

    // Código original para el servidor
    try {
      if (this.action === 'insert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        if (rows.length === 0) return { data: [], error: null };

        const results = [];
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return val;
            if (val instanceof Date) return val;
            if (Array.isArray(val)) {
              // Si es un array de strings o números, lo pasamos crudo para que pg lo trate como text[] o integer[]
              // Si contiene objetos, lo convertimos a JSON para jsonb
              const isSimpleArray = val.every(item => typeof item === 'string' || typeof item === 'number');
              return isSimpleArray ? val : JSON.stringify(val);
            }
            if (typeof val === 'object') {
              return JSON.stringify(val);
            }
            return val;
          });
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          
          let queryStr = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          // Soporte básico para upsert (asumiendo 'id' como clave primaria)
          if (keys.includes('id')) {
            const updates = keys.filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ');
            if (updates) {
               queryStr += ` ON CONFLICT (id) DO UPDATE SET ${updates}`;
            } else {
               queryStr += ` ON CONFLICT (id) DO NOTHING`;
            }
          }
          
          queryStr += ` RETURNING *`;
          const res = await localQuery(queryStr, values);
          results.push(res[0]);
        }
        
        let data = Array.isArray(this.payload) ? results : results[0];
        
        if (this.isSingle && Array.isArray(data)) {
          data = data[0] || null;
        }

        if (this.isSingle && !data && !this.allowNoRows) {
           return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data, error: null };
      }

      if (this.action === 'update') {
        const keys = Object.keys(this.payload);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = Object.values(this.payload).map(val => {
          if (val === null || val === undefined) return val;
          if (val instanceof Date) return val;
          if (Array.isArray(val)) {
            // Heurística: arrays simples -> text[], arrays complejos -> jsonb
            const isSimpleArray = val.every(item => typeof item === 'string' || typeof item === 'number');
            return isSimpleArray ? val : JSON.stringify(val);
          }
          if (typeof val === 'object') {
            return JSON.stringify(val);
          }
          return val;
        });
        
        let queryStr = `UPDATE ${this.table} SET ${setClause}`;
        
        if (this.filters.length > 0) {
          const whereClause = this.filters.map((f, i) => `${f.column} ${f.operator} $${keys.length + i + 1}`).join(' AND ');
          queryStr += ` WHERE ${whereClause}`;
          values.push(...this.filters.map(f => f.value));
        }
        
        queryStr += ` RETURNING *`;
        const resultRows = await localQuery(queryStr, values);
        
        let data = this.isSingle ? resultRows[0] : resultRows;
        
        if (this.isSingle && !data && !this.allowNoRows) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        
        return { data: data || (this.isSingle ? null : []), error: null };
      }

      if (this.action === 'delete') {
        let queryStr = `DELETE FROM ${this.table}`;
        const values: any[] = [];
        
        if (this.filters.length > 0) {
          const whereClause = this.filters.map((f, i) => `${f.column} ${f.operator} $${i + 1}`).join(' AND ');
          queryStr += ` WHERE ${whereClause}`;
          values.push(...this.filters.map(f => f.value));
        }
        
        queryStr += ` RETURNING *`;
        const resultRows = await localQuery(queryStr, values);
        
        if (this.isSingle && resultRows.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        
        return { data: this.isSingle ? resultRows[0] : resultRows, error: null };
      }

      // Default: SELECT
      let queryStr = `SELECT ${this.columns} FROM ${this.table}`;
      const values: any[] = [];
      
      if (this.filters.length > 0) {
        const parts: string[] = [];
        let paramIndex = 1;
        const newValues: any[] = [];

        for (const f of this.filters) {
          if (f.operator === 'IN' || f.operator === 'NOT IN') {
            const placeholders = f.value.map(() => `$${paramIndex++}`).join(', ');
            parts.push(`${f.column} ${f.operator} (${placeholders})`);
            newValues.push(...f.value);
          } else {
            parts.push(`${f.column} ${f.operator} $${paramIndex++}`);
            newValues.push(f.value);
          }
        }
        queryStr += ` WHERE ${parts.join(' AND ')}`;
        values.push(...newValues);
      }
      
      if (this.orderBy) {
        queryStr += ` ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
      }
      
      if (this.limitCount) {
        queryStr += ` LIMIT ${this.limitCount}`;
      }
      
      const resultRows = await localQuery(queryStr, values);
      
      let data = this.isSingle ? resultRows[0] : resultRows;
      
      if (this.isSingle && !data && !this.allowNoRows) {
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      }

      return { data: data || (this.isSingle ? null : []), error: null };
    } catch (error: any) {
      console.error(`Local Bridge Error (${this.action} ${this.table}):`, error);
      return { data: null, error: { message: error.message, details: error.hint } };
    }
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : result;
  }
}

export const dbBridge = {
  from: (table: string) => new LocalQueryBuilder(table),
  rpc: (fn: string, params?: any) => {
    console.warn(`⚠️ dbBridge: .rpc('${fn}') called but not implemented.`);
    return { data: null, error: null };
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (filePath: string, file: any, options?: any) => {
        try {
          // Si estamos en el servidor, usamos LocalStorageService
          if (typeof window === 'undefined') {
             const { LocalStorageService } = require('@/services/local-storage');
             const buffer = Buffer.from(await file.arrayBuffer());
             const fileName = filePath.split('/').pop() || `file-${Date.now()}`;
             const folder = bucket === 'product-images' ? 'products' : bucket;
             
             const result = await LocalStorageService.uploadFile(buffer, fileName, folder, file.type);
             return { data: { path: filePath, url: result.url }, error: null };
          }
          return { data: { path: filePath }, error: null };
        } catch (error: any) {
          console.error('❌ dbBridge Storage Error:', error);
          return { data: null, error };
        }
      },
      remove: async (paths: string[]) => {
        try {
          if (typeof window === 'undefined') {
            const { LocalStorageService } = require('@/services/local-storage');
            for (const path of paths) {
              await LocalStorageService.deleteFile(path);
            }
          }
          return { data: paths, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },
      getPublicUrl: (filePath: string) => {
        // En el servidor, generamos la URL local probable
        const fileName = filePath.split('/').pop() || '';
        const bucket = 'products'; // Simplificación
        return { data: { publicUrl: `/uploads/${bucket}/${fileName}` } };
      }
    })
  }
};
