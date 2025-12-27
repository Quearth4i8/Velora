import { CharacterDraft, CharacterStyle, AIModel, Ethnicity } from './types';
import { characterAPI } from './api';
import {
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES,
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_EXTRA_NEGATIVE_PROMPT,
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX,
  normalizeAspectRatioId,
  getDimensionsFromAspectRatio,
  isLandscapeOrCinematicAspectRatio,
} from '@/config/aspect-ratios';
import {
  getRandomRacePose,
  hasCustomPoses,
  HAND_POSE_VARIATIONS_ARACHNE,
  HAND_POSE_VARIATIONS_GENERIC,
} from '@/config/race-poses';
import { ETHNICITY_PROMPT_MAP } from '@/config/ethnicity-prompts';
import { hexToColorName } from '@/config/color-mappings';
import { EYE_TYPE_DESCRIPTIONS } from '@/config/eye-type-descriptions';
import { STYLE_PROMPTS } from '@/config/style-prompts';
import {
  REGULAR_HUMANOID_CLOTHING_MAP,
  REGULAR_CENTAUR_CLOTHING_MAP,
  REGULAR_LEGLESS_CLOTHING_MAP,
  NSFW_HUMANOID_CLOTHING_MAP,
  NSFW_CENTAUR_CLOTHING_MAP,
  NSFW_LEGLESS_CLOTHING_MAP,
} from '@/config/clothing-prompts';

const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';

const STYLE_TO_MODEL_MAP: Record<CharacterStyle, AIModel> = {
  [CharacterStyle.ANIME]: AIModel.ONEOBSESSION,
  [CharacterStyle.REALISTIC]: AIModel.CYBERREALISTIC,
  [CharacterStyle.ARTISTIC]: AIModel.PERFECTDELIBERATE,
};



const dedupeCommaTags = (input: string): string => {
  const parts = String(input || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part);
  }
  return result.join(', ');
};

const joinAndDedupeTags = (...pieces: Array<string | undefined | null | false>): string => {
  const joined = pieces
    .filter((piece): piece is string => typeof piece === 'string' && piece.trim().length > 0)
    .join(', ');
  return dedupeCommaTags(joined);
};

const sanitizeCommaTags = (input: string, removeTagsLower: Set<string>): string => {
  const parts = String(input || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const result: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (removeTagsLower.has(key)) continue;
    result.push(part);
  }

  return result.join(', ');
};

const sanitizeSpecialPrompt = (mainTagLower: string, specialPrompt?: string | null): string => {
  const baseRemove = new Set<string>([
    'beautiful detailed eyes',
    'perfect symmetrical eyes',
    'clear pupils',
    'sharp eye details',
    'expressive eyes',
    'extra eyes optional',
    'black widow markings optional',
  ]);

  const isArachne = mainTagLower.includes('arachne') || mainTagLower.includes('spider girl');
  if (isArachne) {
    baseRemove.add('taur');
    baseRemove.add('equine lower body');
    baseRemove.add('horse body');
    baseRemove.add('four legs');
    baseRemove.add('four hooves');
    baseRemove.add('fangs');
    baseRemove.add('subtle fangs');
  }

  return sanitizeCommaTags(specialPrompt || '', baseRemove);
};

const poseMentionsHandsOrArms = (pose: string): boolean => {
  const p = String(pose || '').toLowerCase();
  return p.includes('hand') || p.includes('hands') || p.includes('arm') || p.includes('arms');
};

const getClothingDetails = (
  clothing: string,
  isCharacterGeneration: boolean = true,
  draft?: CharacterDraft
): string => {
  const mainTag = draft?.mainTag?.toLowerCase() || '';
  const specialPrompt = draft?.specialPrompt?.toLowerCase() || '';

  const isCentaur =
    mainTag.includes('centaur') || specialPrompt.includes('centaur') || mainTag.includes('taur') || specialPrompt.includes('taur');
  const isLegless =
    mainTag.includes('lamia') ||
    specialPrompt.includes('lamia') ||
    mainTag.includes('snake') ||
    specialPrompt.includes('snake') ||
    mainTag.includes('serpent') ||
    specialPrompt.includes('serpent') ||
    mainTag.includes('naga') ||
    specialPrompt.includes('naga');

  const regularHumanoidClothingMap = REGULAR_HUMANOID_CLOTHING_MAP;
  const regularCentaurClothingMap = REGULAR_CENTAUR_CLOTHING_MAP;
  const regularLeglessClothingMap = REGULAR_LEGLESS_CLOTHING_MAP;
  const nsfwHumanoidClothingMap = NSFW_HUMANOID_CLOTHING_MAP;
  const nsfwCentaurClothingMap = NSFW_CENTAUR_CLOTHING_MAP;
  const nsfwLeglessClothingMap = NSFW_LEGLESS_CLOTHING_MAP;

  const regularClothingMap = isCentaur
    ? regularCentaurClothingMap
    : isLegless
      ? regularLeglessClothingMap
      : regularHumanoidClothingMap;

  const nsfwClothingMap = isCentaur
    ? nsfwCentaurClothingMap
    : isLegless
      ? nsfwLeglessClothingMap
      : nsfwHumanoidClothingMap;

  if (isCharacterGeneration) {
    return regularClothingMap[clothing.toLowerCase()] || 'casual outfit';
  }

  // For wardrobe changes, use the appropriate mapping
  const allClothingMap = { ...regularClothingMap, ...nsfwClothingMap };
  return allClothingMap[clothing.toLowerCase()] || clothing;
};

const buildLoraTag = (loraName: string, loraWeight?: number | null): string => {
  const weight = typeof loraWeight === 'number' && !Number.isNaN(loraWeight) ? loraWeight : 1;
  return `<lora:${loraName}:${weight}>`;
};

const normalizeLoraNames = (draft: CharacterDraft): string[] => {
  const result: string[] = [];

  // Always add Eyes.safetensors as default
  result.push('Eyes.safetensors');

  const push = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    // Don't add duplicate Eyes.safetensors
    if (trimmed === 'Eyes.safetensors') return;
    result.push(trimmed);
  };

  if (Array.isArray(draft.loraNames)) {
    draft.loraNames.forEach(push);
  }

  if (typeof draft.loraName === 'string') {
    draft.loraName
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => result.push(part));
  }

  return Array.from(new Set(result));
};

const buildPrompt = (draft: CharacterDraft, style: CharacterStyle): string => {
  const { identity, body, appearance, personality } = draft;

  const stylePrompts = STYLE_PROMPTS;

  const mainTag = draft.mainTag?.trim();
  const specialPrompt = sanitizeSpecialPrompt((mainTag || '').toLowerCase(), draft.specialPrompt).trim();

  const mainTagLower = mainTag?.toLowerCase() || '';
  const specialPromptLower = specialPrompt?.toLowerCase() || '';
  const isCentaur =
    mainTagLower.includes('centaur') || specialPromptLower.includes('centaur') || mainTagLower.includes('taur') || specialPromptLower.includes('taur');
  const isDemonish =
    mainTagLower.includes('demon') ||
    mainTagLower.includes('succubus') ||
    specialPromptLower.includes('demon horns') ||
    specialPromptLower.includes('demonmge') ||
    specialPromptLower.includes('succubus');
  const isLamia =
    mainTagLower.includes('lamia') || specialPromptLower.includes('lamia') || mainTagLower.includes('snake woman') || specialPromptLower.includes('snake woman');
  const isArachne =
    mainTagLower.includes('arachne') || specialPromptLower.includes('arachne') || mainTagLower.includes('spider girl') || specialPromptLower.includes('spider girl');
  const hasFangs =
    isArachne ||
    mainTagLower.includes('vampire') ||
    specialPromptLower.includes('vampire') ||
    mainTagLower.includes('fang') ||
    specialPromptLower.includes('fang');

  const loraNamesBase = normalizeLoraNames(draft);
  const loraNames = hasFangs ? Array.from(new Set([...loraNamesBase, 'fangs.safetensors'])) : loraNamesBase;
  const hasSpecialFields = Boolean(draft.mainTag?.trim() || loraNames.length > 0 || draft.specialPrompt?.trim());
  const isSpecialCharacter = draft.characterType === 'special' || hasSpecialFields;

  const ageNumber = typeof identity.age === 'number' && Number.isFinite(identity.age) ? identity.age : null;
  const age = ageNumber !== null ? `${ageNumber} years old` : '';

  const isMinor = ageNumber !== null && ageNumber < 18;
  const subjectDescriptor = isMinor ? 'loli' : 'woman';
  const ageDescriptor =
    ageNumber === null
      ? ''
      : ageNumber <= 12
        ? 'child'
        : ageNumber <= 17
          ? 'teen'
          : ageNumber <= 24
            ? 'young adult'
            : ageNumber <= 34
              ? 'adult'
              : ageNumber <= 44
                ? 'mature adult'
                : 'older adult';
  const ethnicity =
    identity.ethnicity && ETHNICITY_PROMPT_MAP[identity.ethnicity]
      ? isMinor
        ? ETHNICITY_PROMPT_MAP[identity.ethnicity].minor
        : ETHNICITY_PROMPT_MAP[identity.ethnicity].adult
      : '';
  const skinTone = identity.skinTone?.toLowerCase() || '';

  // Body characteristics
  const height = body.height?.toLowerCase() || '';
  const physiqueRaw = body.physique?.toLowerCase() || '';
  const physique = isMinor && ['thicc', 'curvy', 'bbw'].includes(physiqueRaw) ? 'petite' : physiqueRaw;
  const chestSize = body.chestSize?.toLowerCase() || '';

  // Appearance characteristics
  const hairStyle = appearance.hairStyle?.toLowerCase() || '';
  const hairColor = appearance.hairColor?.toLowerCase() || '';
  const eyeColor = appearance.eyeColor?.toLowerCase() || '';
  const eyeType = appearance.eyeType?.toLowerCase() || '';
  const clothing = appearance.clothing?.toLowerCase() || '';
  const environment = appearance.environment?.toLowerCase().replace('_', ' ') || '';

  // Personality characteristics
  const archetype = personality.archetype?.toLowerCase() || '';

  // Build detailed personality description from traits
  const personalityTraits = [];
  if (personality.traits) {
    const { submissiveDominant, insecureConfident, coldPassionate, reservedOutgoing, seriousPlayful } = personality.traits;

    if (submissiveDominant <= 3) personalityTraits.push('submissive');
    else if (submissiveDominant >= 7) personalityTraits.push('dominant');

    if (insecureConfident <= 3) personalityTraits.push('insecure');
    else if (insecureConfident >= 7) personalityTraits.push('confident');

    if (coldPassionate <= 3) personalityTraits.push('cold');
    else if (coldPassionate >= 7) personalityTraits.push('passionate');

    if (reservedOutgoing <= 3) personalityTraits.push('reserved');
    else if (reservedOutgoing >= 7) personalityTraits.push('outgoing');

    if (seriousPlayful <= 3) personalityTraits.push('serious');
    else if (seriousPlayful >= 7) personalityTraits.push('playful');
  }

  const personalityDescription = personalityTraits.length > 0 ? personalityTraits.join(', ') : archetype;

  const eyeTypeDescriptions = EYE_TYPE_DESCRIPTIONS;

  const useEyesLora = style === CharacterStyle.ANIME && loraNames.includes('Eyes.safetensors');
  const loraTags =
    loraNames.length > 0
      ? loraNames
        .map((name) => {
          if (name === 'Eyes.safetensors' && !useEyesLora) return null;
          if (name === 'Eyes.safetensors') return buildLoraTag(name, 0.7);
          if (name === 'fangs.safetensors') return buildLoraTag(name, 1);
          return buildLoraTag(name, draft.loraWeight);
        })
        .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
        .join(', ')
      : '';
  const loraEyes = useEyesLora ? 'loraeyes' : '';

  const skinToneTag = skinTone ? `${hexToColorName(skinTone)} skin` : '';
  const hornColorTag = skinTone && isDemonish ? `${hexToColorName(skinTone)} horns` : '';
  const tailColorTag = hairColor && (isLamia || isArachne) ? `${hexToColorName(hairColor)} tail` : '';
  const fangsActivationTags = hasFangs
    ? 'sharp fangs, visible fangs, clean sharp teeth, symmetrical teeth, slightly parted lips'
    : '';
  const clothingTag = clothing ? `wearing detailed ${getClothingDetails(clothing, false, draft)}` : '';
  const hairColorTag = hairColor ? `${hexToColorName(hairColor)} hair` : '';
  const eyeColorTag = eyeColor ? `${eyeColor} eyes` : '';
  const eyeTypeTag = eyeType ? (eyeTypeDescriptions[eyeType] || `${eyeType} eyes`) : '';
  const environmentTag = environment ? `in ${environment} setting` : '';

  const centaurAnatomy = isCentaur ? 'equine lower body, horse body, four legs, four hooves' : '';

  const prompt = joinAndDedupeTags(
    stylePrompts[style],
    isSpecialCharacter ? mainTag : '',
    isSpecialCharacter ? loraTags : '',
    isSpecialCharacter ? loraEyes : '',
    fangsActivationTags,
    isSpecialCharacter ? specialPrompt : '',
    centaurAnatomy,
    age,
    ethnicity,
    skinToneTag,
    hornColorTag,
    tailColorTag,
    subjectDescriptor,
    ageDescriptor,
    height,
    physique ? `${physique} body` : '',
    chestSize ? `${chestSize} breasts` : '',
    clothingTag,
    hairStyle ? `${hairStyle} hairstyle` : '',
    hairColorTag,
    eyeColorTag,
    eyeTypeTag,
    environmentTag,
    personalityDescription ? `${personalityDescription} personality` : ''
  );

  return prompt;
};

const buildNegativePrompt = (draft?: CharacterDraft): string => {
  let negativePrompt = joinAndDedupeTags(
    'lazyneg',
    'low quality',
    'worst quality',
    'jpeg artifacts',
    'watermark',
    'signature',
    'text',
    'blurry',
    'bad anatomy',
    'bad eyes',
    'asymmetrical eyes',
    'misaligned eyes',
    'cross-eyed',
    'strabismus',
    'multiple pupils',
    'deformed pupils',
    'deformed iris',
    'missing eye',
    'lazy eye',
    'bad hands',
    'missing fingers',
    'extra fingers',
    'extra digit',
    'fewer digits',
    'extra limbs',
    'missing limbs',
    'fused fingers',
    'too many fingers',
    'bad proportions',
    'deformed',
    'disfigured',
    'malformed',
    'mutated',
    'cropped',
    'out of frame',
    'duplicate',
    'multiple faces',
    'multiple people',
    'multiple characters',
    'twins',
    '2girls',
    'two people'
  );

  const extraNegativePrompts: string[] = [];

  const ageNumber =
    typeof draft?.identity?.age === 'number' && Number.isFinite(draft.identity.age) ? draft.identity.age : null;
  if (ageNumber !== null) {
    if (ageNumber < 18) {
      extraNegativePrompts.push('tall, long legs, long neck, long arms, long torso, long body');
    } else if (ageNumber <= 30) {
      extraNegativePrompts.push('old, elderly, wrinkles, aged, middle aged');
    } else if (ageNumber <= 45) {
      extraNegativePrompts.push('elderly, deep wrinkles, aged');
    }
  }

  // Add specific negative prompts for lamia characters
  const mainTag = draft?.mainTag?.toLowerCase() || '';
  const specialPrompt = draft?.specialPrompt?.toLowerCase() || '';
  const isLamia = mainTag.includes('lamia') || specialPrompt.includes('lamia') || mainTag.includes('snake') || specialPrompt.includes('snake');
  const isSlimeGirl = mainTag.includes('slime girl') || specialPrompt.includes('slime girl') || mainTag.includes('slime') || specialPrompt.includes('slime');
  const isCentaur = mainTag.includes('centaur') || specialPrompt.includes('centaur') || mainTag.includes('taur') || specialPrompt.includes('taur');
  const isHarpy = mainTag.includes('harpy') || specialPrompt.includes('harpy');
  const hasNonHumanLegs = isCentaur || isLamia || isHarpy || isSlimeGirl;

  if (hasNonHumanLegs) {
    extraNegativePrompts.push('missing lower body');
  }

  if (isLamia) {
    extraNegativePrompts.push('feet, human legs, human feet, bipedal, two legs, two feet');
  }

  if (isSlimeGirl) {
    extraNegativePrompts.push('opaque skin, solid skin, human skin, white skin, pale skin, skin patches, peeling skin, opaque patches, inconsistent texture, normal skin, flesh tone, bad anatomy, artifacts, blurry texture');
  }

  if (isCentaur) {
    extraNegativePrompts.push(
      'bipedal, human legs, human lower body, only two legs, two-legged centaur, missing hind legs, missing horse legs'
    );
  }

  // Add arachne-specific negative prompts
  const isArachne = mainTag.includes('arachne') || specialPrompt.includes('arachne') || mainTag.includes('spider') || specialPrompt.includes('spider');
  if (isArachne) {
    extraNegativePrompts.push(
      'hands on ground, all fours, crawling pose, crouching with hands down, kneeling on hands, hands touching floor, on all fours pose, quadruped stance, upside down, inverted, hanging, bottom view, underside view, from below, looking up at camera, head at bottom, feet at top, reversed orientation, flipped'
    );
  }

  if (draft?.generation?.negativePrompt) extraNegativePrompts.push(draft.generation.negativePrompt);
  if (draft?.specialNegativePrompt) extraNegativePrompts.push(draft.specialNegativePrompt);

  const hasFangs =
    mainTag.includes('arachne') ||
    specialPrompt.includes('arachne') ||
    mainTag.includes('vampire') ||
    specialPrompt.includes('vampire') ||
    mainTag.includes('fang') ||
    specialPrompt.includes('fang');

  if (hasFangs) {
    extraNegativePrompts.push(
      'bad teeth, deformed teeth, messy teeth, jagged teeth, extra teeth, duplicated teeth, melted teeth, teeth blur, teeth artifacts, crooked teeth'
    );
  }

  if (extraNegativePrompts.length > 0) {
    negativePrompt = joinAndDedupeTags(negativePrompt, extraNegativePrompts.join(', '));
  }

  return dedupeCommaTags(negativePrompt);
};

const pickVariant = (variants: string[], seed?: number): string => {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    const idx = Math.abs(seed) % variants.length;
    return variants[idx];
  }
  return variants[Math.floor(Math.random() * variants.length)];
};

const buildHandPoseVariation = (draft: CharacterDraft, settings?: any): string => {
  if (settings?.lockPose === true) return '';

  const mainTagLower = draft?.mainTag?.toLowerCase() || '';
  const specialPromptLower = draft?.specialPrompt?.toLowerCase() || '';
  const isArachne =
    mainTagLower.includes('arachne') ||
    specialPromptLower.includes('arachne') ||
    mainTagLower.includes('spider girl') ||
    specialPromptLower.includes('spider girl');

  const seedFromSettings =
    typeof settings?.seed === 'number' && Number.isFinite(settings.seed) && settings.seed !== -1 ? settings.seed : undefined;

  // If the user explicitly set a seed, keep pose selection deterministic.
  // Otherwise (seed = -1 / undefined), allow true random variation between generations.
  return pickVariant(
    isArachne ? HAND_POSE_VARIATIONS_ARACHNE : HAND_POSE_VARIATIONS_GENERIC,
    seedFromSettings
  );
};

const buildPromptWithHandPose = (draft: CharacterDraft, style: CharacterStyle, settings?: any): string => {
  const prompt = buildPrompt(draft, style);
  const handPoseVariation = buildHandPoseVariation(draft, settings);
  return joinAndDedupeTags(prompt, handPoseVariation);
};

export const automatic1111API = {
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/samplers`);
      return response.ok;
    } catch (error) {
      console.error('Automatic1111 connection check failed:', error);
      return false;
    }
  },

  async switchModel(modelName: string): Promise<boolean> {
    try {
      // Get current options
      const optionsResponse = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/options`);
      if (!optionsResponse.ok) {
        throw new Error('Failed to get options');
      }

      const options = await optionsResponse.json();
      options.sd_model_checkpoint = modelName;

      // Update options to switch model
      const updateResponse = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to switch model');
      }

      // Wait a moment for model to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    } catch (error) {
      return false;
    }
  },

  async generateCharacterImage(draft: CharacterDraft, settings?: any): Promise<string> {
    if (!draft.generation?.style || !draft.generation?.model) {
      throw new Error('Character style and model must be selected before generation');
    }

    const style = draft.generation.style;
    const model = draft.generation.model;

    const modelSwitched = await automatic1111API.switchModel(model);
    if (!modelSwitched) {
      console.warn(`Failed to switch to model: ${model}, using current model`);
    }

    // Check if character has non-human legs and aspect ratio is landscape/cinematic
    const mainTag = draft?.mainTag?.toLowerCase() || '';
    const specialPrompt = draft?.specialPrompt?.toLowerCase() || '';
    const isLamia = mainTag.includes('lamia') || specialPrompt.includes('lamia') || mainTag.includes('snake') || specialPrompt.includes('snake');
    const isSlimeGirl = mainTag.includes('slime girl') || specialPrompt.includes('slime girl') || mainTag.includes('slime') || specialPrompt.includes('slime');
    const isCentaur = mainTag.includes('centaur') || specialPrompt.includes('centaur') || mainTag.includes('taur') || specialPrompt.includes('taur');
    const isHarpy = mainTag.includes('harpy') || specialPrompt.includes('harpy');
    const isArachne = mainTag.includes('arachne') || specialPrompt.includes('arachne') || mainTag.includes('spider girl') || specialPrompt.includes('spider girl');
    const hasNonHumanLegs = isCentaur || isLamia || isHarpy || isSlimeGirl;

    const aspectRatio = settings?.aspectRatio || 'portrait';
    const isLandscapeOrCinematic = isLandscapeOrCinematicAspectRatio(aspectRatio);

    // Check if character has custom poses and apply them
    const aspectRatioId = normalizeAspectRatioId(aspectRatio);
    const raceType = mainTag || specialPrompt;

    if (hasCustomPoses(raceType)) {
      const randomPose = getRandomRacePose(raceType, aspectRatioId);
      const handPoseVariation = poseMentionsHandsOrArms(randomPose) ? '' : buildHandPoseVariation(draft, settings);
      const modifiedDraft = {
        ...draft,
        specialPrompt: joinAndDedupeTags(draft.specialPrompt, randomPose, handPoseVariation)
      };

      const prompt = buildPrompt(modifiedDraft, style);
      const negativePrompt = buildNegativePrompt(modifiedDraft);

      const payload = {
        prompt,
        negative_prompt: negativePrompt,
        width: settings?.width || getDimensionsFromAspectRatio(aspectRatio, draft.generation.model).width,
        height: settings?.height || getDimensionsFromAspectRatio(aspectRatio, draft.generation.model).height,
        steps: settings?.steps || 30,
        cfg_scale: settings?.cfgScale || 8,
        sampler_name: settings?.sampler || 'DPM++ 2M Karras',
        model_name: model,
        seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
      };

      return automatic1111API.generateImageWithPayload(payload, modifiedDraft, style, model);
    }

    if (isArachne) {
      const randomPose = getRandomRacePose('arachne', aspectRatioId);
      const handPoseVariation = poseMentionsHandsOrArms(randomPose) ? '' : buildHandPoseVariation(draft, settings);
      const modifiedDraft = {
        ...draft,
        specialPrompt: joinAndDedupeTags(draft.specialPrompt, randomPose, handPoseVariation)
      };

      const prompt = buildPrompt(modifiedDraft, style);
      const negativePrompt = buildNegativePrompt(modifiedDraft);

      const payload = {
        prompt,
        negative_prompt: negativePrompt,
        width: settings?.width || getDimensionsFromAspectRatio(aspectRatio).width,
        height: settings?.height || getDimensionsFromAspectRatio(aspectRatio).height,
        steps: settings?.steps || 30,
        cfg_scale: settings?.cfgScale || 8,
        sampler_name: settings?.sampler || 'DPM++ 2M Karras',
        model_name: model,
        seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
      };

      return automatic1111API.generateImageWithPayload(payload, modifiedDraft, style, model);
    }

    if (hasNonHumanLegs && isLandscapeOrCinematic) {
      const randomPose = NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES[Math.floor(Math.random() * NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES.length)];
      const handPoseVariation = poseMentionsHandsOrArms(randomPose) ? '' : buildHandPoseVariation(draft, settings);
      const modifiedDraft = {
        ...draft,
        specialPrompt: joinAndDedupeTags(
          draft.specialPrompt,
          randomPose,
          handPoseVariation,
          NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX
        )
      };

      const prompt = buildPrompt(modifiedDraft, style);
      const negativePrompt = buildNegativePrompt(modifiedDraft);

      const extraNegativePrompts = NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_EXTRA_NEGATIVE_PROMPT;

      const payload = {
        prompt,
        negative_prompt: joinAndDedupeTags(negativePrompt, extraNegativePrompts),
        width: settings?.width || getDimensionsFromAspectRatio(aspectRatio).width,
        height: settings?.height || getDimensionsFromAspectRatio(aspectRatio).height,
        steps: settings?.steps || 30,
        cfg_scale: settings?.cfgScale || 8,
        sampler_name: settings?.sampler || 'DPM++ 2M Karras',
        model_name: model,
        seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
      };

      return automatic1111API.generateImageWithPayload(payload, modifiedDraft, style, model);
    }

    const prompt = buildPromptWithHandPose(draft, style, settings);
    const negativePrompt = buildNegativePrompt(draft);

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      width: settings?.width || getDimensionsFromAspectRatio(aspectRatio).width,
      height: settings?.height || getDimensionsFromAspectRatio(aspectRatio).height,
      steps: settings?.steps || 30,
      cfg_scale: settings?.cfgScale || 8,
      sampler_name: settings?.sampler || 'DPM++ 2M Karras',
      model_name: model,
      seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
    };

    return automatic1111API.generateImageWithPayload(payload, draft, style, model);
  },

  async generateImageWithPayload(payload: any, draft: CharacterDraft, style: CharacterStyle, model: string): Promise<string> {
    try {
      const response = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Automatic1111 API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      // Upload the generated image to Supabase storage and add to gallery
      const base64Image = result.images[0];
      const prompt = typeof payload?.prompt === 'string' && payload.prompt.trim().length > 0 ? payload.prompt : buildPrompt(draft, style);
      const uploadResult = await characterAPI.addCharacterImage(
        draft.id!,
        base64Image,
        prompt,
        model,
        style
      );

      if (!uploadResult.success) {
        throw new Error('Failed to add generated image to gallery');
      }

      // Set this image as primary since it's the first generated image
      if (uploadResult.data?.id) {
        const primaryResult = await characterAPI.setPrimaryImage(draft.id!, uploadResult.data.id);
        if (!primaryResult.success) {
          console.warn('Failed to set image as primary, but image was uploaded successfully');
        }
      }

      // Return the new image URL
      return uploadResult.data?.imageUrl || '';
    } catch (error) {
      console.error('Error generating character image:', error);
      throw error;
    }
  }, // Added a comma here

  getModelForStyle(style: CharacterStyle): AIModel {
    return STYLE_TO_MODEL_MAP[style];
  },
};