import { createClient } from '@supabase/supabase-js';
import { CharacterDraft } from './types';
import { serializeCharacter } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Character creation will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const characterService = {
  async createCharacter(serializedData: Record<string, any>) {
    console.log('Supabase createCharacter called with serialized data:', serializedData);
    
    const { data, error } = await supabase
      .from('characters')
      .insert([serializedData])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async getCharacter(id: string) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
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
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return data;
  },

  async listCharacters(limit = 10) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async listCharactersCached(limit = 10) {
    // Check cache first
    const cacheKey = `characters_list_${limit}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 2 minutes
      if (Date.now() - timestamp < 120000) {
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
        console.warn('Storage quota exceeded, clearing character cache');
        // Clear existing character cache to make space
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('characters_list_')) {
            localStorage.removeItem(key);
          }
        }
        // Try again with smaller cache or skip caching
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data.slice(0, 10), // Limit cache size
            timestamp: Date.now()
          }));
        } catch (secondError) {
          console.warn('Failed to cache even with reduced size, skipping cache');
        }
      } else {
        console.error('Unexpected error caching characters:', error);
      }
    }
    
    return data;
  },

  async updateCharacter(id: string, draft: Partial<CharacterDraft>) {
    // Clear cache for this character when updating
    const cacheKey = `character_${id}`;
    localStorage.removeItem(cacheKey);
    
    // Also clear the list cache
    localStorage.removeItem('characters_list_10');
    localStorage.removeItem('characters_list_50');
    
    // Only include name and age in the update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    // Add name if present
    if (draft.name) {
      updatePayload.name = draft.name;
    }
    
    // Add age if present in identity
    if (draft.identity?.age !== undefined) {
      updatePayload.age = draft.identity.age;
    }
    
    console.log('Updating character with payload:', updatePayload);
    
    const { data, error } = await supabase
      .from('characters')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCharacterDirect(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
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
};
