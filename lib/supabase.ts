import { createClient } from '@supabase/supabase-js';
import { CharacterDraft, Profile } from './types';
import { serializeCharacter, deserializeCharacter } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Character creation will not work.');
}

// Create a single Supabase client instance
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const supabase = supabaseClient;

export const characterService = {
  async createCharacter(character: CharacterDraft): Promise<CharacterDraft> {
    const { data: { session } } = await supabase.auth.getSession();
    const serializedData = serializeCharacter(character);

    // Attach user_id if logged in
    if (session?.user) {
      serializedData.user_id = session.user.id;
    }

    const { data, error } = await supabase
      .from('characters')
      .insert(serializedData)
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
    const { data: { session } } = await supabase.auth.getSession();

    let query = supabase
      .from('characters')
      .select('*')
      .neq('character_type', 'special')
      .neq('name', 'Gallery Generated')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If logged in, only show own characters
    if (session?.user) {
      query = query.eq('user_id', session.user.id);
    } else {
      // If not logged in, show nothing or only public ones if we had a flag
      // For now, return empty or show special only
      return [];
    }

    const { data, error } = await query;
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

    const { data, error } = await supabase
      .from('characters')
      .update(updatePayload)
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
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
