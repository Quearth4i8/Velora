// PostgreSQL Database Adapter - Server-side only

import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'velora',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

console.log('✅ PostgreSQL connected');

// Track current auth state
let currentUser: any = null;
let currentSession: any = null;

// ============================================
// AUTH
// ============================================
export const postgresAuth = {
  async getUser() {
    return { data: { user: currentUser }, error: null };
  },

  async getSession() {
    return { data: { session: currentSession }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Check if user exists in auth.users
    let result = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
    let user = result.rows[0];
    
    if (!user) {
      // Create new user in auth.users
      const id = randomUUID();
      await pool.query(
        `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) 
         VALUES ($1, $2, $3, NOW(), $4)`,
        [id, email, password, JSON.stringify({ full_name: email.split('@')[0] })]
      );
      
      // Get the created user
      result = await pool.query('SELECT * FROM auth.users WHERE id = $1', [id]);
      user = result.rows[0];
    }
    
    const sessionUser = { 
      id: user.id, 
      email: user.email, 
      user_metadata: user.raw_user_meta_data || { full_name: email.split('@')[0] } 
    };
    const session = { user: sessionUser, access_token: 'local-token' };
    
    currentUser = sessionUser;
    currentSession = session;
    
    return { data: { user: sessionUser, session }, error: null };
  },

  async signUp(credentials: { email: string; password: string }) {
    return this.signInWithPassword(credentials);
  },

  async signOut() {
    currentUser = null;
    currentSession = null;
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (currentSession) {
      setTimeout(() => callback('INITIAL_SESSION', currentSession), 0);
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ============================================
// QUERY BUILDER
// ============================================
class PostgresQueryBuilder {
  private table: string;
  private whereConditions: string[] = [];
  private whereParams: any[] = [];
  private orderClause: string = '';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private selectFields: string = '*';
  private joins: { table: string; alias: string; on: string; columns: string[] }[] = [];
  private originalSelect: string = '*';

  constructor(table: string) {
    this.table = table;
  }

  private parseSelect(fields: string) {
    // Reset joins each time select() is called
    this.joins = [];
    this.originalSelect = fields;
    const foreignRefs: { table: string; columns: string }[] = [];
    const mainFields: string[] = [];

    // Parse foreign references like:
    // - "characters(name)"
    // - "characters!inner(name)"
    // - "character_images!left(image_url)"
    const regex = /(\w+)(?:!\w+)?\s*\(\s*([^)]+)\s*\)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(fields)) !== null) {
      // Add any text before this match to mainFields
      const before = fields.slice(lastIndex, match.index).trim();
      if (before) {
        const parts = before.split(',').map(p => p.trim()).filter(p => p);
        mainFields.push(...parts);
      }
      
      foreignRefs.push({
        table: match[1],
        columns: match[2].trim(),
      });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    const after = fields.slice(lastIndex).trim();
    if (after) {
      const parts = after.split(',').map(p => p.trim()).filter(p => p);
      mainFields.push(...parts);
    }

    // Build joins based on foreign key relationships
    foreignRefs.forEach((ref, index) => {
      const alias = `j${index}`;

      // Default heuristic: <singular_table>_id
      let fkColumn = `${ref.table.replace(/s$/, '')}_id`;

      // Special-case: video_requests.image_id references character_images.id
      if (this.table === 'video_requests' && ref.table === 'character_images') {
        fkColumn = 'image_id';
      }

      this.joins.push({
        table: ref.table,
        alias,
        on: `${this.table}.${fkColumn} = ${alias}.id`,
        columns: ref.columns.split(',').map((c) => c.trim()),
      });
    });

    // Build final select fields
    const finalFields: string[] = [];
    
    // Main table fields
    mainFields.forEach(f => {
      if (f === '*') {
        finalFields.push(`${this.table}.*`);
      } else {
        finalFields.push(`${this.table}.${f}`);
      }
    });

    // Join table fields
    this.joins.forEach(join => {
      join.columns.forEach(col => {
        finalFields.push(`${join.alias}.${col} as ${join.alias}_${col}`);
      });
    });

    return finalFields.join(', ') || `${this.table}.*`;
  }

  private transformRow(row: any): any {
    if (!row || !this.joins.length) return row;

    const result: any = {};
    const joinData: any = {};

    // Separate main table fields from join fields
    Object.keys(row).forEach(key => {
      const joinMatch = this.joins.find(j => key.startsWith(`${j.alias}_`));
      
      if (joinMatch) {
        const colName = key.slice(joinMatch.alias.length + 1);
        const tableName = joinMatch.table;
        
        if (!joinData[tableName]) {
          joinData[tableName] = {};
        }
        joinData[tableName][colName] = row[key];
      } else if (key.startsWith(`${this.table}_`)) {
        // Handle table-prefixed main fields
        result[key.slice(this.table.length + 1)] = row[key];
      } else {
        result[key] = row[key];
      }
    });

    // Merge join data
    Object.assign(result, joinData);

    return result;
  }

  select(fields: string | string[]) {
    const fieldsStr = Array.isArray(fields) ? fields.join(', ') : fields;
    this.selectFields = this.parseSelect(fieldsStr);
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  gte(column: string, value: any) {
    this.whereConditions.push(`${column} >= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  lte(column: string, value: any) {
    this.whereConditions.push(`${column} <= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  in(column: string, values: any[]) {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderClause = `ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  offset(count: number) {
    this.offsetValue = count;
    return this;
  }

  async execute(): Promise<{ data: any[] | null; error: any }> {
    let sql = `SELECT ${this.selectFields} FROM ${this.table}`;
    
    // Add joins
    this.joins.forEach(join => {
      sql += ` LEFT JOIN ${join.table} AS ${join.alias} ON ${join.on}`;
    });
    
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    if (this.orderClause) sql += ` ${this.orderClause}`;
    if (this.limitValue) sql += ` LIMIT ${this.limitValue}`;
    if (this.offsetValue) sql += ` OFFSET ${this.offsetValue}`;

    try {
      const result = await pool.query(sql, this.whereParams);
      const transformedData = result.rows.map(row => this.transformRow(row));
      return { data: transformedData, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  single() {
    return {
      then: async (callback: (result: any) => any) => {
        const result = await this.execute();
        return callback(result.error ? result : { data: result.data?.[0] || null, error: null });
      }
    };
  }

  maybeSingle() { return this.single(); }
  then(callback: (result: any) => any) { return this.execute().then(callback); }
}

// ============================================
// TABLE OPERATIONS
// ============================================
export function postgresFrom(table: string) {
  return {
    select: (fields?: string | string[]) => new PostgresQueryBuilder(table).select(fields || '*'),
    
    insert: (data: any | any[], options?: { returning?: string }) => {
      // Return an object that can be chained with .select()
      const insertPromise = (async () => {
        const dataArray = Array.isArray(data) ? data : [data];
        const results: any[] = [];
        
        for (const item of dataArray) {
          const id = item.id || randomUUID();
          const columns = Object.keys(item);
          const values = Object.values(item);
          const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');
          
          const sql = `INSERT INTO ${table} (id, ${columns.join(', ')}) VALUES ($1, ${placeholders})${options?.returning ? ' RETURNING *' : ''}`;
          
          try {
            const result = await pool.query(sql, [id, ...values]);
            results.push(options?.returning ? result.rows[0] : { id });
          } catch (err: any) {
            return { data: null, error: err };
          }
        }
        return { data: results.length === 1 ? results[0] : results, error: null };
      })();
      
      // Return a thenable so `await postgres.from(...).insert(...)` works,
      // and also expose `.select()` for Supabase-like chaining.
      const insertChain: any = {
        then: insertPromise.then.bind(insertPromise),
        catch: insertPromise.catch.bind(insertPromise),
        finally: insertPromise.finally.bind(insertPromise),
        select: (fields?: string | string[]) => {
          // After insert, select the data
          const selectPromise = {
            single: () => ({
              then: async (callback: (result: any) => any) => {
                const insertResult = await insertPromise;
                if (insertResult.error) return callback(insertResult);
                
                const id = insertResult.data?.id;
                if (id) {
                  const builder = new PostgresQueryBuilder(table).select(fields || '*').eq('id', id);
                  const selectResult = await builder.execute();
                  if (selectResult.error) return callback({ data: null, error: selectResult.error });
                  return callback({ data: selectResult.data?.[0] || null, error: null });
                }
                return callback({ data: insertResult.data, error: null });
              }
            }),
            then: async (callback: (result: any) => any) => {
              const insertResult = await insertPromise;
              if (insertResult.error) return callback(insertResult);
              
              const id = insertResult.data?.id;
              if (id) {
                const builder = new PostgresQueryBuilder(table).select(fields || '*').eq('id', id);
                const selectResult = await builder.execute();
                if (selectResult.error) return callback({ data: null, error: selectResult.error });
                return callback({ data: selectResult.data?.[0] || insertResult.data, error: null });
              }
              return callback(insertResult);
            }
          };
          return selectPromise;
        },
      };

      return insertChain;
    },
    
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        const columns = Object.keys(data).filter(k => k !== 'id');
        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${column} = $1 RETURNING *`;
        
        try {
          const result = await pool.query(sql, [value, ...columns.map(col => data[col])]);
          return { data: result.rows, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      
      neq: async (column: string, value: any) => {
        // Not implemented for update
        return { data: null, error: { message: 'Update with neq not implemented' } };
      }
    }),
    
    delete: (options?: { count?: string }) => ({
      eq: async (column: string, value: any) => {
        try {
          const result = await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
          return { count: result.rowCount, error: null };
        } catch (err: any) {
          return { count: 0, error: err };
        }
      },
      
      neq: async (column: string, value: any) => {
        try {
          const result = await pool.query(`DELETE FROM ${table} WHERE ${column} != $1`, [value]);
          return { count: result.rowCount, error: null };
        } catch (err: any) {
          return { count: 0, error: err };
        }
      },

      match: async (conditions: Record<string, any>) => {
        try {
          const columns = Object.keys(conditions);
          const values = Object.values(conditions);
          const whereClause = columns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');
          const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
          const result = await pool.query(sql, values);
          return { count: result.rowCount, error: null };
        } catch (err: any) {
          return { count: 0, error: err };
        }
      }
    }),
    
    upsert: async (data: any, options?: { onConflict: string }) => {
      // Simple upsert using ON CONFLICT
      const id = data.id || randomUUID();
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO ${table} (${columns.join(', ')}) 
        VALUES (${placeholders})
        ON CONFLICT ${options?.onConflict || '(id)'} 
        DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
        RETURNING *
      `;
      
      try {
        const result = await pool.query(sql, values);
        return { data: result.rows[0], error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  };
}

// ============================================
// MAIN CLIENT
// ============================================
export const postgres = {
  auth: postgresAuth,
  from: postgresFrom,
  pool,
};

export default postgres;
