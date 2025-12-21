import { CharacterDraft, Height, Physique } from './types';

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

  const serializedLoraName =
    Array.isArray(draft.loraNames) && draft.loraNames.length > 0
      ? draft.loraNames.join(', ')
      : draft.loraName || null;
  
  const serialized = {
    name: draft.name,
    character_type: draft.characterType || 'custom',
    main_tag: draft.mainTag || null,
    lora_name: serializedLoraName,
    lora_weight: draft.loraWeight ?? null,
    special_prompt: draft.specialPrompt || null,
    special_negative_prompt: draft.specialNegativePrompt || null,
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
    is_gallery_only: draft.isGalleryOnly || false,
  };
  
  return serialized;
};

export const deserializeCharacter = (data: Record<string, any>): CharacterDraft => {
  const normalizeLoraNames = (value: any, fallbackSingle?: any): string[] | undefined => {
    const result: string[] = [];

    const push = (item: any) => {
      if (typeof item !== 'string') return;
      const trimmed = item.trim();
      if (!trimmed) return;
      result.push(trimmed);
    };

    if (Array.isArray(value)) {
      value.forEach(push);
    } else if (typeof value === 'string') {
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => result.push(part));
    }

    if (result.length === 0 && typeof fallbackSingle === 'string') {
      fallbackSingle
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => result.push(part));
    }

    return result.length > 0 ? result : undefined;
  };

  const normalizeHeight = (value: any): Height | null => {
    if (!value) return null;
    if (value === 'below_average') return Height.PETITE;
    if (value === 'giant') return Height.TALL;
    if ((Object.values(Height) as string[]).includes(value)) return value as Height;
    return null;
  };

  const normalizePhysique = (value: any): Physique | null => {
    if (!value) return null;
    if (value === 'average') return Physique.THICC;
    if ((Object.values(Physique) as string[]).includes(value)) return value as Physique;
    return null;
  };

  return {
    id: data.id,
    name: data.name,
    characterType: data.character_type || 'custom',
    mainTag: data.main_tag || undefined,
    loraNames: normalizeLoraNames(data.lora_names, data.lora_name),
    loraName: data.lora_name || undefined,
    loraWeight: data.lora_weight ?? undefined,
    specialPrompt: data.special_prompt || undefined,
    specialNegativePrompt: data.special_negative_prompt || undefined,
    currentStep: 5,
    identity: {
      age: data.age,
      ethnicity: data.ethnicity,
      skinTone: data.skin_tone,
    },
    body: {
      height: normalizeHeight(data.height),
      physique: normalizePhysique(data.physique),
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
    isGalleryOnly: data.is_gallery_only || false,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
};
