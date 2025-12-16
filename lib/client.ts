import { characterAPI } from './api';
import { CharacterDraft } from './types';

export const characterClient = {
  async saveCharacter(draft: CharacterDraft) {
    if (draft.id) {
      return characterAPI.updateCharacter(draft.id, draft);
    }
    return characterAPI.createCharacter(draft);
  },

  async loadCharacter(id: string) {
    return characterAPI.getCharacter(id);
  },

  async loadCharacters(limit?: number) {
    return characterAPI.listCharacters(limit);
  },

  async removeCharacter(id: string) {
    return characterAPI.deleteCharacter(id);
  },
};
