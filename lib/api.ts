import { characterService } from './supabase';
import { CharacterDraft } from './types';
import { serializeCharacter, deserializeCharacter } from './db';

export const characterAPI = {
  async createCharacter(draft: CharacterDraft) {
    try {
      const serialized = serializeCharacter(draft);
      const result = await characterService.createCharacter(serialized as any);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to create character:', error);
      return { success: false, error };
    }
  },

  async getCharacter(id: string) {
    try {
      const result = await characterService.getCharacterCached(id);
      const deserialized = deserializeCharacter(result);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get character:', error);
      return { success: false, error };
    }
  },

  async getCharacters() {
    try {
      const results = await characterService.listCharactersCached(50);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get characters:', error);
      return { success: false, error };
    }
  },

  async listCharacters(limit = 10) {
    try {
      const results = await characterService.listCharactersCached(limit);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to list characters:', error);
      return { success: false, error };
    }
  },

  async updateCharacter(id: string, draft: Partial<CharacterDraft>) {
    try {
      const result = await characterService.updateCharacter(id, draft);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update character:', error);
      return { success: false, error };
    }
  },

  async updateCharacterImage(id: string, imageUrl: string) {
    try {
      // Direct database update to avoid type issues
      const result = await characterService.updateCharacterDirect(id, {
        generated_image: imageUrl,
        generation_status: 'completed',
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update character image:', error);
      return { success: false, error };
    }
  },

  async deleteCharacter(id: string) {
    try {
      await characterService.deleteCharacter(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete character:', error);
      return { success: false, error };
    }
  },
};
