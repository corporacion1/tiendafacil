import { sql } from './neon';

/**
 * A more robust bridge to mimic Supabase query builder for Neon.
 */
class NeonQueryBuilder {
  private table: string;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private columns: string = '*';
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.columns = columns;
    // Only set to select if no other destructive action is set
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
    if (value !== undefined) {
      this.filters.push({ column, operator: '=', value });
    }
    return this;
  }

  not(column: string, operator: string, value: any) {
    const supabaseToSql: Record<string, string> = {
      'eq': '!=',
      'neq': '=',
      'lt': '>=',
      'lte': '>',
      'gt': '<=',
      'gte': '<',
      'is': 'IS NOT',
      'in': 'NOT IN'
    };
    const sqlOp = supabaseToSql[operator] || '!=';
    this.filters.push({ column, operator: sqlOp, value });
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
    return this;
  }

  async execute() {
    try {
      // @ts-expect-error - Using sql.query as per Neon documentation for parameterized queries
      const queryFn = (sql as any).query || sql;

      if (this.action === 'insert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        if (rows.length === 0) return { data: [], error: null };

        const results = [];
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const query = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
          const res = await queryFn(query, values);
          const resultRows = res.rows || (Array.isArray(res) ? res : [res]);
          results.push(resultRows[0]);
        }
        
        const data = Array.isArray(this.payload) ? results : results[0];
        if (this.isSingle && !data) {
           return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data, error: null };
      }

      if (this.action === 'update') {
        const keys = Object.keys(this.payload);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = Object.values(this.payload);
        
        let query = `UPDATE ${this.table} SET ${setClause}`;
        
        if (this.filters.length > 0) {
          const whereClause = this.filters.map((f, i) => `${f.column} ${f.operator} $${keys.length + i + 1}`).join(' AND ');
          query += ` WHERE ${whereClause}`;
          values.push(...this.filters.map(f => f.value));
        }
        
        query += ` RETURNING *`;
        const res = await queryFn(query, values);
        const resultRows = res.rows || (Array.isArray(res) ? res : [res]);
        
        if (this.isSingle && resultRows.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        
        return { data: this.isSingle ? resultRows[0] : resultRows, error: null };
      }

      if (this.action === 'delete') {
        let query = `DELETE FROM ${this.table}`;
        const values: any[] = [];
        
        if (this.filters.length > 0) {
          const whereClause = this.filters.map((f, i) => `${f.column} ${f.operator} $${i + 1}`).join(' AND ');
          query += ` WHERE ${whereClause}`;
          values.push(...this.filters.map(f => f.value));
        }
        
        query += ` RETURNING *`;
        const res = await queryFn(query, values);
        const resultRows = res.rows || (Array.isArray(res) ? res : [res]);
        
        if (this.isSingle && resultRows.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        
        return { data: this.isSingle ? resultRows[0] : resultRows, error: null };
      }

      // Default: SELECT
      let query = `SELECT ${this.columns === '*' ? '*' : this.columns} FROM ${this.table}`;
      const values: any[] = [];
      
      if (this.filters.length > 0) {
        const whereClause = this.filters.map((f, i) => `${f.column} ${f.operator} $${i + 1}`).join(' AND ');
        query += ` WHERE ${whereClause}`;
        values.push(...this.filters.map(f => f.value));
      }
      
      if (this.orderBy) {
        query += ` ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
      }
      
      if (this.limitCount) {
        query += ` LIMIT ${this.limitCount}`;
      }
      
      const res = await queryFn(query, values);
      const resultRows = res.rows || (Array.isArray(res) ? res : [res]);
      
      if (this.isSingle && resultRows.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      }

      return { data: this.isSingle ? resultRows[0] : resultRows, error: null };
    } catch (error: any) {
      console.error(`Neon Bridge Error (${this.action} ${this.table}):`, error);
      return { data: null, error };
    }
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : result;
  }
}

export const neonBridge = {
  from: (table: string) => new NeonQueryBuilder(table)
};
