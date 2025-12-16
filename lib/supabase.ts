import { createClient } from '@supabase/supabase-js';
import { CharacterDraft } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Character creation will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const characterService = {
  async createCharacter(draft: CharacterDraft) {
    const { data, error } = await supabase
      .from('characters')
      .insert([
        {
          age_group: draft.identity.ageGroup,
          custom_age: draft.identity.customAge,
          ethnicity: draft.identity.ethnicity,
          height: draft.body.height,
          physique: draft.body.physique,
          chest_size: draft.body.chestSize,
          butt_size: draft.body.buttSize,
          hair_style: draft.appearance.hairStyle,
          hair_color: draft.appearance.hairColor,
          eye_color: draft.appearance.eyeColor,
          personality_archetype: draft.personality.archetype,
          personality_traits: draft.personality.traits,
          created_at: new Date().toISOString(),
        },
      ])
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

  async listCharacters(limit = 10) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async updateCharacter(id: string, draft: Partial<CharacterDraft>) {
    const { data, error } = await supabase
      .from('characters')
      .update({
        age_group: draft.identity?.ageGroup,
        ethnicity: draft.identity?.ethnicity,
        height: draft.body?.height,
        physique: draft.body?.physique,
        chest_size: draft.body?.chestSize,
        butt_size: draft.body?.buttSize,
        hair_style: draft.appearance?.hairStyle,
        hair_color: draft.appearance?.hairColor,
        eye_color: draft.appearance?.eyeColor,
        personality_archetype: draft.personality?.archetype,
        personality_traits: draft.personality?.traits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async deleteCharacter(id: string) {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
