// src/app/api/db/bridge/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, action, columns, filters, orderBy, limit, payload } = body;

    console.log(`🌉 [API Bridge] Action: ${action} on ${table}`);

    let sql = '';
    const values: any[] = [];
    let paramIndex = 1;

    if (action === 'select') {
      sql = `SELECT ${columns || '*'} FROM ${table}`;
      if (filters && filters.length > 0) {
        const parts = filters.map((f: any) => {
          if (f.operator === 'IN' || f.operator === 'NOT IN') {
            const placeholders = f.value.map(() => `$${paramIndex++}`).join(', ');
            values.push(...f.value);
            return `${f.column} ${f.operator} (${placeholders})`;
          }
          values.push(f.value);
          return `${f.column} ${f.operator} $${paramIndex++}`;
        });
        sql += ` WHERE ${parts.join(' AND ')}`;
      }
      if (orderBy) {
        sql += ` ORDER BY ${orderBy.column} ${orderBy.ascending ? 'ASC' : 'DESC'}`;
      }
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
    } else if (action === 'insert' || action === 'update' || action === 'upsert') {
      // Simplificación: solo manejamos un registro por ahora para el bridge genérico
      const row = Array.isArray(payload) ? payload[0] : payload;
      const keys = Object.keys(row);
      const rowValues = Object.values(row);

      if (action === 'update') {
        const setClause = keys.map(k => `${k} = $${paramIndex++}`).join(', ');
        values.push(...rowValues);
        sql = `UPDATE ${table} SET ${setClause}`;
        if (filters && filters.length > 0) {
          const parts = filters.map((f: any) => {
            values.push(f.value);
            return `${f.column} ${f.operator} $${paramIndex++}`;
          });
          sql += ` WHERE ${parts.join(' AND ')}`;
        }
      } else {
        // Insert o Upsert
        const placeholders = keys.map(() => `$${paramIndex++}`).join(', ');
        values.push(...rowValues);
        sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        
        if (action === 'upsert' && keys.includes('id')) {
          const updates = keys.filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ');
          if (updates) {
            sql += ` ON CONFLICT (id) DO UPDATE SET ${updates}`;
          } else {
            sql += ` ON CONFLICT (id) DO NOTHING`;
          }
        }
      }
      sql += ` RETURNING *`;
    } else if (action === 'delete') {
      sql = `DELETE FROM ${table}`;
      if (filters && filters.length > 0) {
        const parts = filters.map((f: any) => {
          values.push(f.value);
          return `${f.column} ${f.operator} $${paramIndex++}`;
        });
        sql += ` WHERE ${parts.join(' AND ')}`;
      }
      sql += ` RETURNING *`;
    }

    const rows = await query(sql, values);
    return NextResponse.json({ data: rows, error: null });

  } catch (error: any) {
    console.error('❌ [API Bridge] Error:', error);
    return NextResponse.json({ 
      data: null, 
      error: { message: error.message || 'Error en el puente de base de datos' } 
    }, { status: 500 });
  }
}
