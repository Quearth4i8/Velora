import { CharacterDraft, Height, Physique, Ethnicity } from './types';

const PERSISTENT_PROMPT_DELIMITER = '||PERSISTENT_PROMPT||';

export const serializeCharacter = (draft: CharacterDraft): Record<string, any> => {
  // Debug logging
  console.log('Serializing character draft:', draft);
  console.log('Identity:', draft.identity);
  console.log('Identity age:', draft.identity?.age);
  console.log('Identity ethnicity:', draft.identity?.ethnicity);
  console.log('Futanari:', draft.futanari);

  // Check if required identity fields exist, but skip for special characters if they are intentional
  // However, validation is good. For special characters, identity might be partial or mock.
  // The error logs showed 'Identity: Object' so identity is likely present.

  if (!draft.identity && draft.characterType !== 'special') {
    console.error('Identity object is completely missing');
    throw new Error('Identity is missing from character draft');
  }

  const serializedLoraName =
    Array.isArray(draft.loraNames) && draft.loraNames.length > 0
      ? draft.loraNames.join(', ')
      : draft.loraName || null;

  const specialPrompt = typeof draft.specialPrompt === 'string' ? draft.specialPrompt.trim() : '';
  const persistentPrompt = typeof draft.persistentPrompt === 'string' ? draft.persistentPrompt.trim() : '';

  const serializedSpecialPrompt = persistentPrompt
    ? `${specialPrompt}${specialPrompt ? '\n' : ''}${PERSISTENT_PROMPT_DELIMITER}${persistentPrompt}`
    : (specialPrompt || null);

  const heatValueRaw = draft.heat;
  const heatValue = typeof heatValueRaw === 'number' && Number.isFinite(heatValueRaw)
    ? Math.min(100, Math.max(0, Math.round(heatValueRaw)))
    : null;

  const serialized = {
    name: draft.name,
    character_type: draft.characterType || 'custom',
    style_preset: draft.stylePreset || null,
    main_tag: draft.mainTag || null,
    lora_name: serializedLoraName,
    lora_weight: draft.loraWeight ?? null,
    special_prompt: serializedSpecialPrompt,
    special_negative_prompt: draft.specialNegativePrompt || null,
    age: draft.identity?.age ?? null,
    ethnicity: draft.identity?.ethnicity ?? null,
    skin_tone: draft.identity?.skinTone || null,
    height: draft.body?.height || null,
    physique: draft.body?.physique || null,
    chest_size: draft.body?.chestSize || null,
    butt_size: draft.body?.buttSize || null,
    hair_style: draft.appearance?.hairStyle || null,
    hair_color: draft.appearance?.hairColor || null,
    eye_color: draft.appearance?.eyeColor || null,
    eye_type: draft.appearance?.eyeType || null,
    clothing: draft.appearance?.clothing || null,
    custom_clothing: draft.appearance?.customClothing || undefined,
    environment: draft.appearance?.environment || null,
    personality_archetype: draft.personality?.archetype || null,
    personality_traits: draft.personality ? {
      ...draft.personality.traits,
      customSpecialty: draft.personality.customSpecialty || null
    } : null,
    style: draft.generation?.style,
    model: draft.generation?.model,
    generated_image: draft.generation?.generatedImage,
    is_gallery_only: draft.isGalleryOnly || false,
    futanari: draft.futanari || false,
    heat: heatValue,
    user_id: draft.userId || null,
  };

  return serialized;
};

export const deserializeCharacter = (data: Record<string, any>): CharacterDraft => {
  const clampHeat = (value: any): number | undefined => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(100, Math.max(0, Math.round(n)));
  };
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

  const normalizeEthnicity = (value: any): Ethnicity | null => {
    if (!value) return null;
    if ((Object.values(Ethnicity) as string[]).includes(value)) return value as Ethnicity;

    const normalized = String(value).trim().toLowerCase();
    const legacyMap: Record<string, Ethnicity> = {
      caucasian: Ethnicity.RUSSIAN,
      african: Ethnicity.BRAZILIAN,
      asian: Ethnicity.EAST_ASIAN,
      middle_eastern: Ethnicity.LEBANESE,
      latin: Ethnicity.LATIN_AMERICAN,
      mixed: Ethnicity.MIXED_EXOTIC,
    };

    if (legacyMap[normalized]) return legacyMap[normalized];
    return null;
  };

  const rawSpecialPrompt = typeof data.special_prompt === 'string' ? data.special_prompt : '';
  let deserializedSpecialPrompt = rawSpecialPrompt.trim() || undefined;
  let deserializedPersistentPrompt = '';

  const delimiterIndex = rawSpecialPrompt.indexOf(PERSISTENT_PROMPT_DELIMITER);
  if (delimiterIndex !== -1) {
    const before = rawSpecialPrompt.slice(0, delimiterIndex).trim();
    const after = rawSpecialPrompt.slice(delimiterIndex + PERSISTENT_PROMPT_DELIMITER.length).trim();
    deserializedSpecialPrompt = before || undefined;
    deserializedPersistentPrompt = after || '';
  }

  return {
    id: data.id,
    name: data.name,
    characterType: data.character_type || 'custom',
    stylePreset: data.style_preset || undefined,
    mainTag: data.main_tag || undefined,
    loraNames: normalizeLoraNames(data.lora_names, data.lora_name),
    loraName: data.lora_name || undefined,
    loraWeight: data.lora_weight ?? undefined,
    specialPrompt: deserializedSpecialPrompt,
    specialNegativePrompt: data.special_negative_prompt || undefined,
    persistentPrompt: deserializedPersistentPrompt,
    currentStep: 5,
    identity: {
      age: data.age,
      ethnicity: normalizeEthnicity(data.ethnicity),
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
      customClothing: data.custom_clothing || undefined,
      environment: data.environment,
    },
    personality: {
      archetype: data.personality_archetype,
      isCustom: data.personality_archetype === 'custom',
      traits: {
        submissiveDominant: data.personality_traits?.submissiveDominant ?? 50,
        insecureConfident: data.personality_traits?.insecureConfident ?? 50,
        coldPassionate: data.personality_traits?.coldPassionate ?? 50,
        reservedOutgoing: data.personality_traits?.reservedOutgoing ?? 50,
        seriousPlayful: data.personality_traits?.seriousPlayful ?? 50,
      },
      customSpecialty: data.personality_traits?.customSpecialty || undefined,
    },
    generation: {
      style: data.style,
      model: data.model,
      generationStatus: 'pending',
      generatedImage: data.generated_image,
      seed: data.generation_seed || undefined,
    },
    isGalleryOnly: data.is_gallery_only || false,
    futanari: data.futanari || false,
    heat: clampHeat(data.heat),
    userId: data.user_id,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
};
