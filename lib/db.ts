import { CharacterDraft } from './types';

export const serializeCharacter = (draft: CharacterDraft): Record<string, any> => {
  return {
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
  };
};

export const deserializeCharacter = (data: Record<string, any>): CharacterDraft => {
  return {
    currentStep: 5,
    identity: {
      ageGroup: data.age_group,
      customAge: data.custom_age,
      ethnicity: data.ethnicity,
    },
    body: {
      height: data.height,
      physique: data.physique,
      chestSize: data.chest_size,
      buttSize: data.butt_size,
    },
    appearance: {
      hairStyle: data.hair_style,
      hairColor: data.hair_color,
      eyeColor: data.eye_color,
    },
    personality: {
      archetype: data.personality_archetype,
      isCustom: data.personality_archetype === 'custom',
      traits: data.personality_traits,
    },
  };
};
