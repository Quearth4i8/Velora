import { CharacterDraft } from './types';

export const serializeCharacter = (draft: CharacterDraft): Record<string, any> => {
  // Debug logging
  console.log('Serializing character draft:', draft);
  console.log('Identity:', draft.identity);
  console.log('Identity age:', draft.identity?.age);
  console.log('Identity ethnicity:', draft.identity?.ethnicity);
  
  // Check if required identity fields exist
  if (!draft.identity) {
    console.error('Identity object is completely missing');
    throw new Error('Identity is missing from character draft');
  }
  
  if (!draft.identity.age) {
    console.error('Age is missing from identity');
    throw new Error('Age is missing from character draft');
  }
  
  if (!draft.identity.ethnicity) {
    console.error('Ethnicity is missing from identity');
    throw new Error('Ethnicity is missing from character draft');
  }
  
  const serialized = {
    name: draft.name,
    age: draft.identity.age,
    ethnicity: draft.identity.ethnicity,
    skin_tone: draft.identity.skinTone || null,
    height: draft.body.height,
    physique: draft.body.physique,
    chest_size: draft.body.chestSize,
    butt_size: draft.body.buttSize,
    hair_style: draft.appearance.hairStyle,
    hair_color: draft.appearance.hairColor,
    eye_color: draft.appearance.eyeColor,
    eye_type: draft.appearance.eyeType,
    clothing: draft.appearance.clothing,
    environment: draft.appearance.environment,
    personality_archetype: draft.personality.archetype,
    personality_traits: draft.personality.traits,
    style: draft.generation?.style,
    model: draft.generation?.model,
    generated_image: draft.generation?.generatedImage,
  };
  
  return serialized;
};

export const deserializeCharacter = (data: Record<string, any>): CharacterDraft => {
  return {
    id: data.id,
    name: data.name,
    currentStep: 5,
    identity: {
      age: data.age,
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
      eyeType: data.eye_type,
      clothing: data.clothing,
      environment: data.environment,
    },
    personality: {
      archetype: data.personality_archetype,
      isCustom: data.personality_archetype === 'custom',
      traits: data.personality_traits,
    },
    generation: {
      style: data.style,
      model: data.model,
      generationStatus: 'pending',
      generatedImage: data.generated_image,
    },
  };
};
