// Local PostgreSQL Database - Server/Client Safe
// No Supabase - completely local with pgAdmin

import { CharacterDraft, Profile } from './types';
import { serializeCharacter, deserializeCharacter } from './db';

// ============================================
// TYPE INTERFACES for Query Builder
// ============================================
interface QueryResult<T = any> {
  data: T | null;
  error: Error | null;
}

interface ChainableQuery {
  eq: (column: string, value: any) => ChainableQuery;
  neq: (column: string, value: any) => ChainableQuery;
  gte: (column: string, value: any) => ChainableQuery;
  lte: (column: string, value: any) => ChainableQuery;
  in: (column: string, values: any[]) => ChainableQuery;
  order: (column: string, opts?: { ascending?: boolean }) => ChainableQuery;
  limit: (n: number) => ChainableQuery;
  range: (start: number, end: number) => ChainableQuery;
  single: () => { then: (cb: (result: QueryResult) => any) => Promise<any> };
  maybeSingle: () => { then: (cb: (result: QueryResult) => any) => Promise<any> };
  then: (cb: (result: QueryResult) => any) => Promise<any>;
}

interface SelectableQuery {
  select: (fields?: string | string[]) => { single: () => Promise<QueryResult>; then: (cb: (result: QueryResult) => any) => Promise<any> };
}

interface TableQueryBuilder {
  select: (fields?: string | string[], options?: { count?: string; head?: boolean }) => ChainableQuery;
  insert: (data: any) => SelectableQuery;
  // Loosely typed to support Supabase-like chaining (e.g. update().eq().select().single())
  update: (data: any) => any;
  // Loosely typed to support eq/match variations in browser/server wrappers
  delete: (opts?: { count?: string }) => any;
}

// ============================================
// BROWSER-SIDE: Use API routes
// ============================================
const isBrowser = typeof window !== 'undefined';

// Auth state change callbacks
let authCallbacks: Array<(event: string, session: any) => void> = [];

const emitAuthStateChange = (event: string, session: any) => {
  authCallbacks.forEach(cb => cb(event, session));
};

const browserAuth = {
  async getUser() {
    const res = await fetch('/api/auth/user');
    return res.json();
  },
  async getSession() {
    const res = await fetch('/api/auth/session');
    return res.json();
  },
  async signInWithPassword(credentials: { email: string; password: string }) {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const result = await res.json();
    
    // Emit auth state change on successful signin
    if (!result.error && result.data?.session) {
      emitAuthStateChange('SIGNED_IN', result.data.session);
    }
    
    return result;
  },
  async signUp(credentials: { email: string; password: string }) {
    return this.signInWithPassword(credentials);
  },
  async signOut() {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    const result = await res.json();
    
    // Emit auth state change
    emitAuthStateChange('SIGNED_OUT', null);
    
    return result;
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    authCallbacks.push(callback);
    
    // Check current session immediately
    this.getSession().then(({ data: { session } }) => {
      if (session) {
        callback('INITIAL_SESSION', session);
      }
    });
    
    return { 
      data: { 
        subscription: { 
          unsubscribe: () => {
            authCallbacks = authCallbacks.filter(cb => cb !== callback);
          } 
        } 
      } 
    };
  }
};

const browserFrom = (table: string): TableQueryBuilder => {
  // Build query state
  let queryState = {
    table,
    selectFields: '*',
    count: null as string | null,
    head: false,
    eqFilters: [] as Array<{ column: string; value: any }>,
    neqFilters: [] as Array<{ column: string; value: any }>,
    gteFilters: [] as Array<{ column: string; value: any }>,
    lteFilters: [] as Array<{ column: string; value: any }>,
    inFilters: null as { column: string; values: any[] } | null,
    orderColumn: null as string | null,
    orderAscending: false,
    limitCount: null as number | null,
    rangeStart: null as number | null,
    rangeEnd: null as number | null,
    singleMode: false
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('table', queryState.table);
    params.append('select', queryState.selectFields);

    if (queryState.count) {
      params.append('count', queryState.count);
    }
    if (queryState.head) {
      params.append('head', 'true');
    }
    
    queryState.eqFilters.forEach(f => params.append(`eq.${f.column}`, f.value));
    queryState.neqFilters.forEach(f => params.append(`neq.${f.column}`, f.value));
    queryState.gteFilters.forEach(f => params.append(`gte.${f.column}`, f.value));
    queryState.lteFilters.forEach(f => params.append(`lte.${f.column}`, f.value));
    if (queryState.inFilters) {
      params.append(`in.${queryState.inFilters.column}`, queryState.inFilters.values.join(','));
    }
    
    if (queryState.orderColumn) {
      const direction = queryState.orderAscending ? '.asc' : '.desc';
      params.append('order', queryState.orderColumn + direction);
    }
    if (queryState.rangeStart !== null && queryState.rangeEnd !== null) {
      params.append('offset', queryState.rangeStart.toString());
      params.append('limit', (queryState.rangeEnd - queryState.rangeStart + 1).toString());
    } else if (queryState.limitCount) {
      params.append('limit', queryState.limitCount.toString());
    }
    
    return `/api/db?${params.toString()}`;
  };

  const executeQuery = async () => {
    const url = buildQueryString();
    const res = await fetch(url);
    const result = await res.json();
    
    if (queryState.singleMode && result.data && Array.isArray(result.data)) {
      return { data: result.data[0] || null, error: result.error };
    }
    return result;
  };

  const createChain = () => ({
    eq: (column: string, value: any) => {
      queryState.eqFilters.push({ column, value });
      return createChain();
    },
    neq: (column: string, value: any) => {
      queryState.neqFilters.push({ column, value });
      return createChain();
    },
    gte: (column: string, value: any) => {
      queryState.gteFilters.push({ column, value });
      return createChain();
    },
    lte: (column: string, value: any) => {
      queryState.lteFilters.push({ column, value });
      return createChain();
    },
    in: (column: string, values: any[]) => {
      queryState.inFilters = { column, values };
      return createChain();
    },
    order: (column: string, opts?: { ascending?: boolean }) => {
      queryState.orderColumn = column;
      queryState.orderAscending = opts?.ascending ?? false;
      return createChain();
    },
    limit: (n: number) => {
      queryState.limitCount = n;
      return createChain();
    },
    range: (start: number, end: number) => {
      queryState.rangeStart = start;
      queryState.rangeEnd = end;
      return createChain();
    },
    single: () => {
      queryState.singleMode = true;
      return {
        then: async (cb: any) => {
          const result = await executeQuery();
          return cb(result);
        }
      };
    },
    maybeSingle: () => {
      queryState.singleMode = true;
      return { then: async (cb: any) => {
        const result = await executeQuery();
        // maybeSingle returns null instead of error when no rows found
        if (result.error?.code === 'PGRST116' || (Array.isArray(result.data) && result.data.length === 0)) {
          return cb({ data: null, error: null });
        }
        return cb(result);
      }};
    },
    then: async (cb: any) => cb(await executeQuery())
  });

  return {
    select: (fields?: string | string[], options?: { count?: string; head?: boolean }) => {
      queryState.selectFields = Array.isArray(fields) ? fields.join(',') : (fields || '*');
      queryState.count = options?.count ?? null;
      queryState.head = options?.head ?? false;
      return createChain();
    },
    insert: (data: any) => {
      const insertPromise = (async () => {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table, data, returning: true })
        });
        return await res.json();
      })();
      return {
        then: insertPromise.then.bind(insertPromise),
        catch: insertPromise.catch.bind(insertPromise),
        finally: insertPromise.finally.bind(insertPromise),
        select: (fields?: string | string[]) => {
          const selectPromise = {
            single: async () => {
              const result = await insertPromise;
              const singleData = Array.isArray(result.data) ? result.data[0] || null : result.data;
              return { data: singleData, error: result.error };
            },
            then: async (cb: any) => {
              const result = await insertPromise;
              return cb(result);
            }
          };
          return selectPromise;
        }
      };
    },
    update: (data: any) => ({
      eq: (column: string, value: any) => {
        const updatePromise = (async () => {
          const res = await fetch('/api/db', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table, data, where: { column, value } })
          });
          return res.json();
        })();

        return {
          then: updatePromise.then.bind(updatePromise),
          catch: updatePromise.catch.bind(updatePromise),
          finally: updatePromise.finally.bind(updatePromise),
          select: (fields?: string | string[]) => {
            const selectPromise = {
              single: async () => {
                const result = await updatePromise;
                const singleData = Array.isArray(result.data) ? result.data[0] || null : result.data;
                return { data: singleData, error: result.error };
              },
              then: async (cb: any) => {
                const result = await updatePromise;
                return cb(result);
              }
            };
            return selectPromise;
          }
        };
      }
    }),
    delete: (opts?: { count?: string }) => ({
      eq: async (column: string, value: any) => {
        const res = await fetch('/api/db', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table, where: { column, value }, count: opts?.count })
        });
        return res.json();
      },
      match: async (conditions: Record<string, any>) => {
        // Build where clause with multiple conditions
        const columns = Object.keys(conditions);
        const values = Object.values(conditions);
        const res = await fetch('/api/db', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            table, 
            where: { column: columns, value: values }, 
            match: true,
            count: opts?.count 
          })
        });
        return res.json();
      }
    })
  };
};

// ============================================
// SERVER-SIDE: Direct postgres (dynamic import)
// ============================================
let postgresModule: any = null;

async function loadPostgres() {
  if (!postgresModule && !isBrowser) {
    const { postgres } = await import('@/db/postgres');
    postgresModule = postgres;
  }
  return postgresModule;
}

const serverAuth = {
  async getUser() {
    const pg = await loadPostgres();
    return pg.auth.getUser();
  },
  async getSession() {
    const pg = await loadPostgres();
    return pg.auth.getSession();
  },
  async signInWithPassword(creds: any) {
    const pg = await loadPostgres();
    return pg.auth.signInWithPassword(creds);
  },
  async signUp(creds: any) {
    const pg = await loadPostgres();
    return pg.auth.signUp(creds);
  },
  async signOut() {
    const pg = await loadPostgres();
    return pg.auth.signOut();
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

const serverFrom = (table: string) => ({
  select: (fields?: string | string[]) => {
    const builderPromise = loadPostgres().then(pg => pg.from(table).select(fields || '*'));
    return new Proxy({} as any, {
      get(target, prop) {
        return async (...args: any[]) => {
          const builder = await builderPromise;
          const method = builder[prop];
          if (typeof method === 'function') {
            return method.apply(builder, args);
          }
          return method;
        };
      }
    });
  },
  insert: (data: any) => ({
    select: async (fields?: string | string[]) => {
      const pg = await loadPostgres();
      return pg.from(table).insert(data, { returning: true });
    }
  }),
  update: (data: any) => ({
    eq: async (column: string, value: any) => {
      const pg = await loadPostgres();
      return pg.from(table).update(data).eq(column, value);
    }
  }),
  delete: () => ({
    eq: async (column: string, value: any) => {
      const pg = await loadPostgres();
      return pg.from(table).delete().eq(column, value);
    },
    match: async (conditions: Record<string, any>) => {
      const pg = await loadPostgres();
      return pg.from(table).delete().match(conditions);
    }
  })
});

// ============================================
// UNIFIED EXPORT
// ============================================
export const supabase = isBrowser ? {
  auth: browserAuth,
  from: browserFrom
} : {
  auth: serverAuth,
  from: serverFrom
};

console.log(isBrowser ? '🌐 Browser mode - using API routes' : '✅ Server mode - using PostgreSQL');

export const characterService = {
  async createCharacter(character: CharacterDraft): Promise<CharacterDraft> {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if trying to create a special character
    if (character.characterType === 'special') {
      // Only admins can create special characters
      if (!session?.user) {
        throw new Error('Authentication required to create special characters');
      }
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !profile?.is_admin) {
        throw new Error('Unauthorized: Only admins can create special characters');
      }
    }
    
    const serializedData = serializeCharacter(character);

    // Attach user_id if logged in
    if (session?.user) {
      serializedData.user_id = session.user.id;
    }

    const { data, error } = await (supabase
      .from('characters')
      .insert(serializedData) as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating character:', error);
      throw error;
    }

    return deserializeCharacter(data);
  },

  async getCharacter(id: string) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Get primary image's seed for consistency
    const { data: imageData, error: imageError } = await supabase
      .from('character_images')
      .select('generation_seed')
      .eq('character_id', id)
      .eq('is_primary', true)
      .limit(1)
      .single();
    
    if (!imageError && imageData?.generation_seed) {
      data.generation_seed = imageData.generation_seed;
    }
    
    return data;
  },

  async listSpecialCharactersCached(limit = 10) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'public';
    const cacheKey = `special_characters_list_${userId}_${limit}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache special characters for 10 minutes (they are mostly static)
      if (Date.now() - timestamp < 600000) {
        return data;
      }
    }

    const data = await this.listSpecialCharacters(limit);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('special_characters_list_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    }

    return data;
  },

  async getCharacterCached(id: string) {
    // Check cache first
    const cacheKey = `character_${id}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 5 minutes
      if (Date.now() - timestamp < 300000) {
        return data;
      }
    }

    // Fetch from database
    const data = await this.getCharacter(id);

    // Cache the result with error handling
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (cacheError) {
      // Silently handle cache quota exceeded error
      if (cacheError instanceof DOMException && cacheError.name === 'QuotaExceededError') {
        console.warn('Character cache quota exceeded, skipping cache for:', id);
      } else {
        console.warn('Failed to cache character:', cacheError);
      }
    }

    return data;
  },

  async listCharacters(limit = 10) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .neq('character_type', 'special')
      .neq('name', 'Gallery Generated')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async listSpecialCharacters(limit = 10) {
    // Special characters might be global, so we don't necessarily filter by user_id
    // unless the user specifically wants to create OWN special ones.
    // For now, special characters remain global presets.
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('character_type', 'special')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async listUserCharacters(limit = 50) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async listCharactersCached(limit = 10) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const userId = session.user.id;
    const cacheKey = `characters_list_${userId}_${limit}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 30 seconds (more responsive than 2 mins)
      if (Date.now() - timestamp < 30000) {
        return data;
      }
    }

    // Fetch from database
    const data = await this.listCharacters(limit);

    // Cache the result
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('characters_list_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    }

    return data;
  },

  async updateCharacter(id: string, draft: Partial<CharacterDraft>) {
    // Clear cache for this character when updating
    const cacheKey = `character_${id}`;
    localStorage.removeItem(cacheKey);

    // Also clear the list cache for this user
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userId = session.user.id;
      localStorage.removeItem(`characters_list_${userId}_10`);
      localStorage.removeItem(`characters_list_${userId}_50`);
      localStorage.removeItem(`special_characters_list_${userId}_10`);
      localStorage.removeItem(`special_characters_list_${userId}_50`);
    } else {
      // Clear legacy/public keys
      localStorage.removeItem('characters_list_10');
      localStorage.removeItem('characters_list_50');
      localStorage.removeItem('special_characters_list_10');
      localStorage.removeItem('special_characters_list_50');
    }

    const { data: existing, error: existingError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError) throw existingError;

    const existingDraft = deserializeCharacter(existing);
    const merged: CharacterDraft = {
      ...existingDraft,
      ...draft,
      identity: {
        ...existingDraft.identity,
        ...(draft.identity || {}),
      },
      body: {
        ...existingDraft.body,
        ...(draft.body || {}),
      },
      appearance: {
        ...existingDraft.appearance,
        ...(draft.appearance || {}),
      },
      personality: {
        ...existingDraft.personality,
        ...(draft.personality || {}),
        traits: {
          ...(existingDraft.personality?.traits || {}),
          ...((draft.personality as any)?.traits || {}),
        },
      } as any,
      generation: {
        ...existingDraft.generation,
        ...(draft.generation || {}),
      },
    };

    const updatePayload: Record<string, any> = {
      ...serializeCharacter(merged),
      updated_at: new Date().toISOString(),
    };

    delete updatePayload.user_id;

    console.log('Final update payload:', updatePayload);

    const { data, error } = await (supabase
      .from('characters')
      .update(updatePayload) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return deserializeCharacter(data);
  },

  async updateCharacterDirect(id: string, updates: Record<string, any>) {
    // Clear cache for this character when updating directly
    try {
      const cacheKey = `character_${id}`;
      localStorage.removeItem(cacheKey);

      // Also clear the list cache for this user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        localStorage.removeItem(`characters_list_${userId}_10`);
        localStorage.removeItem(`characters_list_${userId}_50`);
        localStorage.removeItem(`special_characters_list_${userId}_10`);
        localStorage.removeItem(`special_characters_list_${userId}_50`);
      } else {
        localStorage.removeItem('characters_list_10');
        localStorage.removeItem('characters_list_50');
        localStorage.removeItem('special_characters_list_10');
        localStorage.removeItem('special_characters_list_50');
      }
    } catch (e) {
      // Ignore cache clearing errors
    }

    const { data, error } = await (supabase
      .from('characters')
      .update(updates) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCharacter(id: string) {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMessage(messageId: string) {
    console.log('🗑️ Supabase: Executing delete for message:', messageId);
    
    // First check if message exists
    const { data: existingMessage, error: checkError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    
    if (checkError) {
      console.error('❌ Supabase: Error checking message existence:', checkError);
    } else {
      console.log('📋 Supabase: Found message to delete:', existingMessage);
    }
    
    // Execute delete
    const { error, count } = await supabase
      .from('messages')
      .delete({ count: 'exact' })
      .eq('id', messageId);

    if (error) {
      console.error('❌ Supabase: Delete error:', error);
      throw error;
    }
    
    console.log('✅ Supabase: Delete completed successfully');
    console.log('📊 Supabase: Records deleted:', count);
    
    // If no records were deleted, this is likely an RLS policy issue
    if (count === 0) {
      console.error('🚫 Supabase: DELETE BLOCKED - No records deleted. This is likely a Row Level Security (RLS) policy issue.');
      console.error('🔧 Supabase: Check your Supabase dashboard RLS policies for the messages table');
      throw new Error('Delete operation failed: Row Level Security policy prevents deletion. Check Supabase RLS policies.');
    }
    
    // Verify deletion by checking if message still exists
    const { data: deletedCheck, error: verifyError } = await supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Supabase: Error verifying deletion:', verifyError);
    } else {
      console.log('🔍 Supabase: Message still exists after delete:', deletedCheck);
    }
  },
};

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  },

  async updateProfile(userId: string, updates: { full_name?: string; username?: string; avatar_url?: string; points_balance?: number; spin_pity_count?: number }): Promise<Profile> {
    const { data, error } = await (supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      }) as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  async checkUsernameAvailability(username: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking username availability:', error);
      return false;
    }

    return data === null;
  }
};
