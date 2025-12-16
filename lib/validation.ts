import { CharacterDraft } from './types';

export const validateStep = (step: number, draft: CharacterDraft): boolean => {
  switch (step) {
    case 1:
      return !!(draft.identity.age && draft.identity.ethnicity);
    case 2:
      return !!(
        draft.body.height &&
        draft.body.physique &&
        draft.body.chestSize &&
        draft.body.buttSize
      );
    case 3:
      return !!(
        draft.appearance.hairStyle &&
        draft.appearance.hairColor &&
        draft.appearance.eyeColor
      );
    case 4:
      return !!draft.personality.archetype;
    case 5:
      return true;
    default:
      return false;
  }
};

export const validateDraft = (draft: CharacterDraft): boolean => {
  for (let step = 1; step <= 5; step++) {
    if (!validateStep(step, draft)) {
      return false;
    }
  }
  return true;
};

export const getValidationErrors = (step: number, draft: CharacterDraft): string[] => {
  const errors: string[] = [];

  switch (step) {
    case 1:
      if (!draft.identity.age) errors.push('Age is required');
      if (!draft.identity.ethnicity) errors.push('Ethnicity is required');
      break;
    case 2:
      if (!draft.body.height) errors.push('Height is required');
      if (!draft.body.physique) errors.push('Physique is required');
      if (!draft.body.chestSize) errors.push('Chest size is required');
      if (!draft.body.buttSize) errors.push('Butt size is required');
      break;
    case 3:
      if (!draft.appearance.hairStyle) errors.push('Hair style is required');
      if (!draft.appearance.hairColor) errors.push('Hair color is required');
      if (!draft.appearance.eyeColor) errors.push('Eye color is required');
      break;
    case 4:
      if (!draft.personality.archetype) errors.push('Personality archetype is required');
      break;
  }

  return errors;
};
