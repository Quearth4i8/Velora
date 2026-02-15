import { CharacterDraft, CharacterStyle, AIModel, Ethnicity, ClothingStyle, ImageGenerationPlan, Environment } from './types';

import { characterAPI } from './api';
import { supabase } from './supabase';
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
import { hexToColorName, normalizeA1111ColorName } from '@/config/color-mappings';
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

const AUTOMATIC1111_URL = process.env.A1111_URL || process.env.AUTOMATIC1111_URL || 'http://localhost:7860';
const AUTOMATIC1111_PROXY_URL = '/api/automatic1111/txt2img';
const AUTOMATIC1111_GENERIC_PROXY_PREFIX = '/api/automatic1111';

type SdModelEntry = {
  title?: string;
  model_name?: string;
  hash?: string;
  sha256?: string;
  filename?: string;
};

let cachedSdModels: { at: number; data: SdModelEntry[] } | null = null;
const resolvedCheckpointCache = new Map<string, string>();

const fetchSdModels = async (): Promise<SdModelEntry[]> => {
  const now = Date.now();
  if (cachedSdModels && now - cachedSdModels.at < 60_000) {
    return cachedSdModels.data;
  }

  const res = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/sd-models`);
  if (!res.ok) {
    throw new Error(`Failed to fetch A1111 sd-models: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SdModelEntry[];
  cachedSdModels = { at: now, data: Array.isArray(data) ? data : [] };
  return cachedSdModels.data;
};

const resolveSdModelCheckpoint = async (checkpoint: string): Promise<string> => {
  const input = String(checkpoint || '').trim();
  if (!input) return input;

  const cached = resolvedCheckpointCache.get(input);
  if (cached) return cached;

  // If it's already in "title [hash]" form, keep it.
  if (/\[[0-9a-f]{6,}\]$/i.test(input)) {
    resolvedCheckpointCache.set(input, input);
    return input;
  }

  try {
    const models = await fetchSdModels();
    const byExactTitle = models.find((m) => m.title === input);
    const byModelName = models.find((m) => m.model_name === input);
    const byFilename = models.find((m) => {
      const f = String(m.filename || '').replace(/\\/g, '/');
      return f.endsWith(`/${input}`) || f.endsWith(input);
    });
    const byTitlePrefix = models.find((m) => typeof m.title === 'string' && m.title.startsWith(`${input} [`));

    const resolved =
      (byExactTitle?.title || byModelName?.title || byFilename?.title || byTitlePrefix?.title || input).trim();

    resolvedCheckpointCache.set(input, resolved);
    return resolved;
  } catch {
    // If resolving fails, fall back to the original string.
    resolvedCheckpointCache.set(input, input);
    return input;
  }
};

export const STYLE_TO_MODEL_MAP: Record<CharacterStyle, AIModel> = {
  [CharacterStyle.ANIME]: AIModel.PREFECT_ILLUSTRIOUS,
  [CharacterStyle.ANIME_ILLUSTRIOUS]: AIModel.WAI_ILLUSTRIOUS_SDXL,
  [CharacterStyle.MOE_FUSSION]: AIModel.MOE_FUSSION_V1_5_0_Z_VZ,
  [CharacterStyle.REALISTIC]: AIModel.CYBERREALISTIC,
  [CharacterStyle.ARTISTIC]: AIModel.PERFECTDELIBERATE,
  [CharacterStyle.SPECIAL]: AIModel.PREFECT_ILLUSTRIOUS,
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

const removeCommaTags = (input: string, removeTagsLower: Set<string>): string => {
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

const COMPOSITION_TRIGGER_TAGS_LOWER = new Set<string>([
  'side by side',
  'split screen',
  'reference sheet',
  'character sheet',
  'turnaround',
  'multiple views',
  'two views',
  'three views',
  'collage',
  'panel',
  'panels',
  'comic',
  'comic panel'
]);

const sanitizeCompositionTagsFromPrompt = (commaTags: string): string => {
  return removeCommaTags(commaTags, COMPOSITION_TRIGGER_TAGS_LOWER);
};

const shouldPreferNonFullBodyFromCameraTags = (cameraTags: string[]): boolean => {
  const lower = (Array.isArray(cameraTags) ? cameraTags : []).map((t) => String(t || '').toLowerCase());
  return (
    lower.some((t) => t.includes('close-up') || t.includes('close up')) ||
    lower.some((t) => t.includes('portrait')) ||
    lower.some((t) => t.includes('upper body')) ||
    lower.some((t) => t.includes('lower body'))
  );
};

const SOLO_ENFORCING_TAGS_LOWER = new Set<string>([
  'solo',
  'single character',
  'single character composition',
  'one subject centered',
  'one subject',
  'one subject centered composition',
]);

const ensureSoloPromptTags = (input: string): string => {
  const cleaned = removeCommaTags(String(input || '').trim(), SOLO_ENFORCING_TAGS_LOWER);
  if (!cleaned) return 'solo';

  const mustIncludeLower = ['solo', '1girl', 'single character'];
  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const lower = parts.map((p) => p.toLowerCase());

  for (const tag of mustIncludeLower) {
    if (!lower.includes(tag)) {
      parts.unshift(tag);
      lower.unshift(tag);
    }
  }
  return dedupeCommaTags(parts.join(', '));
};

const ensureCouplePromptTags = (input: string): string => {
  const cleaned = removeCommaTags(String(input || '').trim(), SOLO_ENFORCING_TAGS_LOWER);
  if (!cleaned) return '1girl, 1boy';

  const mustIncludeLower = ['1girl', '1boy'];
  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const lower = parts.map((p) => p.toLowerCase());

  for (const tag of mustIncludeLower) {
    if (!lower.includes(tag)) {
      parts.unshift(tag);
      lower.unshift(tag);
    }
  }
  return dedupeCommaTags(parts.join(', '));
};

const detectOralSexIntentFromMessage = (messageContent?: string) => {
  const t = String(messageContent || '').toLowerCase();
  const mentionsCock = t.includes('cock') || t.includes('dick') || t.includes('penis');
  const mentionsOral =
    t.includes('blowjob') ||
    t.includes('deepthroat') ||
    t.includes('oral') ||
    t.includes('suck') ||
    t.includes('sucking') ||
    t.includes('lick') ||
    t.includes('licking');
  const explicitOral = mentionsCock && mentionsOral;
  return {
    explicitOral,
    mentionsCock,
  };
};

const ensureNoMultiSubjectNegativeTags = (input: string): string => {
  return joinAndDedupeTags(
    input,
    'multiple girls',
    '2girls',
    'two girls',
    '3girls',
    'three girls',
    'group',
    'threesome',
    'orgy',
    'multiple people',
    'extra person',
    'duplicate',
    'duplicates'
  );
};

const ensureNoReferenceSheetNegativeTags = (input: string): string => {
  return joinAndDedupeTags(
    input,
    'reference sheet',
    'character sheet',
    'turnaround',
    'multiple views',
    'two views',
    'three views',
    'split screen',
    'collage',
    'comic',
    'comic panel',
    'panel',
    'panels',
    'triptych'
  );
};

const shouldSuppressReferenceSheetFromText = (text?: string): boolean => {
  const t = String(text || '').toLowerCase();
  if (!t) return false;
  return (
    t.includes('side by side') ||
    t.includes('multiple views') ||
    t.includes('two views') ||
    t.includes('three views') ||
    t.includes('front view') ||
    t.includes('back view') ||
    t.includes('reference sheet') ||
    t.includes('character sheet') ||
    t.includes('turnaround') ||
    t.includes('split screen') ||
    t.includes('collage') ||
    t.includes('comic panel')
  );
};

const shouldIncludeMalePartnerFromCurrentText = (messageContent?: string): boolean => {
  const t = String(messageContent || '').toLowerCase();
  if (!t) return false;

  // Only add a male partner when the CURRENT text strongly implies another person
  // or a partnered act. Do NOT infer a male partner from nudity/anatomy alone.
  const partnerCues = [
    '1boy',
    'boy',
    'man',
    'with him',
    'with a man',
    'with a boy',
    'couple',
    'couples',
    'kissing',
    'kiss',
    'make out',
    'making out',
    'hugging',
    'hug',
    'cuddling',
    'cuddle',
    'holding hands',
    'handholding',
    'hand holding',
    'dancing',
    'dance',
    'cock',
    'dick',
    'penis',
    'balls',
    'blowjob',
    'deepthroat',
    'handjob',
    'throat fuck',
    'throatfuck',
    'vaginal sex',
    'anal sex',
    'penetration',
    'fuck',
    'fucking',
    'intercourse',
    'creampie',
    'cumshot',
    'cum in',
  ];
  return partnerCues.some((cue) => t.includes(cue));
};

const shouldIncludeUserFromCurrentText = (messageContent?: string): boolean => {
  const t = String(messageContent || '').toLowerCase();
  if (!t) return false;

  // Detect when the user is mentioned as being present/interacting in the scene
  // This is separate from sexual/romantic partner detection
  const userPresenceCues = [
    'user',
    'next to user',
    'beside user',
    'with user',
    'to user',
    'at user',
    'looking at user',
    'facing user',
    'talking to user',
    'speaking to user',
    'handing',
    'giving to',
    'offering to',
    'showing to user',
    'sharing with user',
    'sitting next to',
    'standing next to',
    'walking with',
    'sitting with',
    'standing with',
    'together with user',
    'POV',
    'point of view',
    'viewer',
    'looking at viewer',
    'facing viewer',
  ];
  return userPresenceCues.some((cue) => t.includes(cue));
};

const isSelfActionFromCurrentText = (messageContent?: string): boolean => {
  const t = String(messageContent || '').toLowerCase();
  if (!t) return false;

  const selfRef = t.includes('herself') || t.includes('her own') || t.includes('by herself');
  if (!selfRef) return false;

  const actCues = ['blowjob', 'deepthroat', 'oral', 'suck', 'sucking'];
  return actCues.some((cue) => t.includes(cue));
};

const PARTNER_BLOCKING_NEGATIVE_TAGS_LOWER = new Set<string>(['multiple people', 'extra person']);

const ensureNoExtraPeopleNegativeTagsForCouple = (input: string): string => {
  return joinAndDedupeTags(
    input,
    'multiple girls',
    '2girls',
    'two girls',
    '3girls',
    'three girls',
    'group',
    'threesome',
    'orgy',
    'duplicate',
    'duplicates'
  );
};

const shouldAllowSexActTagsFromCurrentText = (messageContent?: string): boolean => {
  const t = String(messageContent || '').toLowerCase();
  if (!t) return false;

  // Only allow explicit sex-act tags if the current message explicitly contains them.
  // This avoids “jumping ahead” based on prior context or character persona.
  const explicitTokens = [
    'blowjob',
    'deepthroat',
    'throat fuck',
    'throatfuck',
    'oral sex',
    'handjob',
    'fingering',
    'cunnilingus',
    'rimming',
    'vaginal sex',
    'anal sex',
    'penetration',
    'fuck',
    'fucking',
    'suck',
    'sucking',
  ];

  return explicitTokens.some((tok) => t.includes(tok));
};

const filterSexActTagsIfNotExplicit = (tags: string[], allow: boolean): string[] => {
  if (allow) return tags;
  const banned = new Set(
    [
      'blowjob',
      'deepthroat',
      'throat fucking',
      'throat fucking',
      'throat fuck',
      'throatfuck',
      'oral sex',
      'vaginal sex',
      'anal sex',
      'handjob',
      'fingering',
      'cunnilingus',
      'rimming',
      'facial',
      'cumshot',
      'creampie',
      'cumming',
      'cum in mouth',
      'spitroast',
      'double penetration',
    ].map((t) => t.toLowerCase())
  );
  return tags.filter((t) => !banned.has(String(t || '').toLowerCase().trim()));
};

const applyModelPromptDefaults = (model: AIModel, prompt: string, negativePrompt: string) => {
  if (model === AIModel.WAI_ILLUSTRIOUS_SDXL) {
    return {
      prompt: joinAndDedupeTags('masterpiece', 'best quality', 'amazing quality', '1girl', prompt),
      negativePrompt: joinAndDedupeTags('bad quality', 'worst quality', 'worst detail', 'sketch', 'censor', negativePrompt),
    };
  }
  if (model === AIModel.MOE_FUSSION_V1_5_0_Z_VZ) {
    return {
      prompt: joinAndDedupeTags('masterpiece', 'best quality', '1girl', 'solo', 'full body', prompt),
      negativePrompt: joinAndDedupeTags(
        'lowres',
        'worst quality',
        'low quality',
        'old',
        'early',
        'bad anatomy',
        'bad hands',
        '4koma',
        'comic',
        'greyscale',
        'censored',
        'jpeg artifacts',
        'aged up',
        negativePrompt
      ),
    };
  }
  return { prompt, negativePrompt };
};

const applyHiresFixSettings = (payload: any, settings?: any): any => {
  if (!settings?.hiresFix) return payload;

  return {
    ...payload,
    enable_hr: true,
    hr_scale: typeof settings?.hiresScale === 'number' ? settings.hiresScale : 2,
    hr_upscaler: typeof settings?.hiresUpscaler === 'string' ? settings.hiresUpscaler : 'R-ESRGAN 4x+ Anime6B',
    hr_second_pass_steps: typeof settings?.hiresSteps === 'number' ? settings.hiresSteps : 0,
    denoising_strength: typeof settings?.hiresDenoise === 'number' ? settings.hiresDenoise : 0.35,
  };
};

export const buildCharacterBasePrompts = (draft: CharacterDraft) => {
  const style = draft?.generation?.style;
  const model = draft?.generation?.model;

  const fallbackPrompt = String(draft?.generation?.prompt || '').trim();
  const fallbackNegativePrompt = String(draft?.generation?.negativePrompt || '').trim();

  if (!style || !model) {
    return { prompt: fallbackPrompt, negativePrompt: fallbackNegativePrompt };
  }

  let prompt = buildPrompt(draft, style);
  let negativePrompt = buildNegativePrompt(draft);

  ({ prompt, negativePrompt } = applyModelPromptDefaults(model, prompt, negativePrompt));

  if (style === CharacterStyle.REALISTIC || model === AIModel.CYBERREALISTIC) {
    prompt = `score_9, score_8_up, score_7_up, ${prompt}`;
    negativePrompt = `score_6, score_5, score_4, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), ${negativePrompt}`;
  }

  return { prompt, negativePrompt };
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
  ]);

  return sanitizeCommaTags(specialPrompt || '', baseRemove);
};

const hasPromptToken = (text: string, token: string): boolean => {
  const t = String(text || '').toLowerCase();
  const tok = String(token || '').toLowerCase();
  if (!t || !tok) return false;
  return t
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .some((part) => part === tok);
};

const getArachneCptContext = (draft?: CharacterDraft) => {
  const mainTagLower = draft?.mainTag?.toLowerCase() || '';
  const specialPromptLower = draft?.specialPrompt?.toLowerCase() || '';
  const enabled = hasPromptToken(mainTagLower, 'arachnecpt') || hasPromptToken(specialPromptLower, 'arachnecpt');
  if (!enabled) {
    return {
      enabled: false,
      modifiers: ''
    };
  }

  const combined = `${mainTagLower}, ${specialPromptLower}`;
  const modifiers: string[] = [];

  if (combined.includes('multiple eyes')) modifiers.push('multiple eyes');
  if (hasPromptToken(combined, 'taur')) modifiers.push('taur');
  if (combined.includes('extra arms') || combined.includes('extra arm')) modifiers.push('extra arms');
  if (combined.includes('claw') || combined.includes('claws')) modifiers.push('claw');
  if (hasPromptToken(combined, 'fluffy')) modifiers.push('fluffy');
  if (hasPromptToken(combined, 'spikes') || hasPromptToken(combined, 'spike')) modifiers.push('spikes');

  return {
    enabled: true,
    modifiers: modifiers.join(', ')
  };
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
    mainTag.includes('centaur') ||
    specialPrompt.includes('centaur') ||
    mainTag.includes('taur') ||
    specialPrompt.includes('taur');
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

const buildPrompt = (draft: CharacterDraft, style: CharacterStyle, settings?: any, messageContent?: string): string => {
  const { identity, body, appearance, personality } = draft;

  const stylePrompts = STYLE_PROMPTS;

  let mainTag = draft.mainTag?.trim();
  let specialPrompt = sanitizeSpecialPrompt((mainTag || '').toLowerCase(), draft.specialPrompt).trim();

  const mainTagLower = mainTag?.toLowerCase() || '';
  const specialPromptLower = specialPrompt?.toLowerCase() || '';
  const originalMessageLower = (messageContent || '').toLowerCase();

  const isSlimeGirl = mainTagLower.includes('slime girl') || specialPromptLower.includes('slime girl');
  const isCentaur =
    mainTagLower.includes('centaur') ||
    specialPromptLower.includes('centaur') ||
    mainTagLower.includes('taur') ||
    specialPromptLower.includes('taur');
  // Extract additional tags and futa setting from settings
  const additionalTags = settings?.additionalTags?.trim() || '';
  const isFuta = settings?.isFuta || false;

  // Add futa tags if enabled
  let futaTags = '';
  if (isFuta) {
    // Check if clothing is SFW or NSFW
    const nsfwClothing = [
      ClothingStyle.LINGERIE,
      ClothingStyle.NAKED,
      ClothingStyle.BIKINI,
      ClothingStyle.UNDERWEAR,
      ClothingStyle.REVEALING,
      ClothingStyle.BODYSUIT
    ];
    
    const isNsfwClothing = appearance.clothing && nsfwClothing.includes(appearance.clothing as ClothingStyle);
    
    if (isCentaur) {
      if (isNsfwClothing) {
        // NSFW clothing - show explicit equine genitalia
        futaTags = 'futanari, equine genitalia, horse penis, sheath';
      } else {
        // SFW clothing - show equine bulge/sheath
        futaTags = 'futanari, equine bulge, horse sheath, clothed equine genitalia';
      }
    } else {
      if (isNsfwClothing) {
        // NSFW clothing - show explicit content
        futaTags = 'futanari, huge penis, veiny penis, testicles';
      } else {
        // SFW clothing - show bulge only
        futaTags = 'futanari, bulge, crotch bulge, hidden bulge, clothed bulge';
      }
    }
  }

  // Combine all tags
  const persistentPrompt = draft.persistentPrompt?.trim() || '';
  const allAdditionalTags = joinAndDedupeTags(additionalTags, futaTags, persistentPrompt);

  // Check if prompt contains sexual content that should allow male presence
  // Also check if it's a self-action to avoid adding male partner for solo activities
  const isSelfActionFromMessage =
    (originalMessageLower.includes('gives herself') ||
      originalMessageLower.includes('give herself') ||
      originalMessageLower.includes('herself') ||
      originalMessageLower.includes('her own')) &&
    (originalMessageLower.includes('blowjob') ||
      originalMessageLower.includes('deepthroat') ||
      originalMessageLower.includes('oral') ||
      originalMessageLower.includes('suck'));

  const isSelfAction =
    mainTagLower.includes('her own') ||
    mainTagLower.includes('herself') ||
    (mainTagLower.includes('takes') &&
      mainTagLower.includes('penis') &&
      (mainTagLower.includes('her') || mainTagLower.includes('his')) &&
      mainTagLower.includes('into her mouth')) ||
    ((mainTagLower.includes('futanari') || specialPromptLower.includes('futanari')) &&
      (mainTagLower.includes('blowjob') ||
        mainTagLower.includes('deepthroat') ||
        mainTagLower.includes('oral') ||
        specialPromptLower.includes('blowjob') ||
        specialPromptLower.includes('deepthroat') ||
        specialPromptLower.includes('oral'))) ||
    (mainTagLower.includes('solo') &&
      (mainTagLower.includes('blowjob') ||
        mainTagLower.includes('deepthroat') ||
        mainTagLower.includes('oral') ||
        mainTagLower.includes('sucking'))) ||
    isSelfActionFromMessage;

  const mainTagAfterLower = mainTag?.toLowerCase() || '';
  const specialPromptAfterLower = specialPrompt?.toLowerCase() || '';

  const hasSexualContent =
    mainTagAfterLower.includes('oral sex') ||
    mainTagAfterLower.includes('sex') ||
    mainTagAfterLower.includes('intercourse') ||
    mainTagAfterLower.includes('blowjob') ||
    mainTagAfterLower.includes('deepthroat') ||
    mainTagAfterLower.includes('autofellatio') ||
    mainTagLower.includes('fucking') ||
    mainTagLower.includes('penetration') ||
    mainTagLower.includes('anal') ||
    mainTagLower.includes('anal sex') ||
    mainTagLower.includes('anus') ||
    mainTagLower.includes('doggy') ||
    mainTagLower.includes('doggy style') ||
    mainTagLower.includes('missionary') ||
    mainTagLower.includes('cowgirl') ||
    mainTagLower.includes('riding') ||
    mainTagLower.includes('cock') ||
    mainTagLower.includes('dick') ||
    mainTagLower.includes('pussy') ||
    mainTagLower.includes('cum') ||
    mainTagLower.includes('cumshot') ||
    mainTagLower.includes('creampie') ||
    mainTagLower.includes('facial') ||
    mainTagLower.includes('handjob') ||
    mainTagLower.includes('masturbation') ||
    mainTagLower.includes('orgasm') ||
    mainTagLower.includes('moaning') ||
    mainTagLower.includes('breastfeeding') ||
    mainTagLower.includes('titjob') ||
    mainTagLower.includes('boobjob') ||
    mainTagLower.includes('footjob') ||
    mainTagLower.includes('rimjob') ||
    mainTagLower.includes('69') ||
    mainTagLower.includes('sixty nine') ||
    mainTagLower.includes('threesome') ||
    mainTagLower.includes('foursome') ||
    mainTagLower.includes('gangbang') ||
    mainTagLower.includes('orgy') ||
    mainTagLower.includes('swallowing') ||
    mainTagLower.includes('sucking') ||
    mainTagLower.includes('licking') ||
    mainTagLower.includes('eating out') ||
    mainTagLower.includes('cunnilingus') ||
    mainTagLower.includes('facesitting') ||
    mainTagLower.includes('queening') ||
    mainTagLower.includes('spanking') ||
    mainTagLower.includes('bondage') ||
    mainTagLower.includes('bdsm') ||
    mainTagLower.includes('dominant') ||
    mainTagLower.includes('submissive') ||
    mainTagLower.includes('master') ||
    mainTagLower.includes('slave') ||
    mainTagLower.includes('kinky') ||
    mainTagLower.includes('fetish') ||
    specialPromptAfterLower.includes('oral sex') ||
    specialPromptAfterLower.includes('sex') ||
    specialPromptAfterLower.includes('intercourse') ||
    specialPromptAfterLower.includes('blowjob') ||
    specialPromptAfterLower.includes('deepthroat') ||
    specialPromptAfterLower.includes('autofellatio') ||
    specialPromptLower.includes('fucking') ||
    specialPromptLower.includes('penetration') ||
    specialPromptLower.includes('anal') ||
    specialPromptLower.includes('anal sex') ||
    specialPromptLower.includes('anus') ||
    specialPromptLower.includes('doggy') ||
    specialPromptLower.includes('doggy style') ||
    specialPromptLower.includes('missionary') ||
    specialPromptLower.includes('cowgirl') ||
    specialPromptLower.includes('riding') ||
    specialPromptLower.includes('cock') ||
    specialPromptLower.includes('dick') ||
    specialPromptLower.includes('pussy') ||
    specialPromptLower.includes('cum') ||
    specialPromptLower.includes('cumshot') ||
    specialPromptLower.includes('creampie') ||
    specialPromptLower.includes('facial') ||
    specialPromptLower.includes('handjob') ||
    specialPromptLower.includes('masturbation') ||
    specialPromptLower.includes('orgasm') ||
    specialPromptLower.includes('moaning') ||
    specialPromptLower.includes('breastfeeding') ||
    specialPromptLower.includes('titjob') ||
    specialPromptLower.includes('boobjob') ||
    specialPromptLower.includes('footjob') ||
    specialPromptLower.includes('rimjob') ||
    specialPromptLower.includes('69') ||
    specialPromptLower.includes('sixty nine') ||
    specialPromptLower.includes('threesome') ||
    specialPromptLower.includes('foursome') ||
    specialPromptLower.includes('gangbang') ||
    specialPromptLower.includes('orgy') ||
    specialPromptLower.includes('swallowing') ||
    specialPromptLower.includes('sucking') ||
    specialPromptLower.includes('licking') ||
    specialPromptLower.includes('eating out') ||
    specialPromptLower.includes('cunnilingus') ||
    specialPromptLower.includes('facesitting') ||
    specialPromptLower.includes('queening') ||
    specialPromptLower.includes('spanking') ||
    specialPromptLower.includes('bondage') ||
    specialPromptLower.includes('bdsm') ||
    specialPromptLower.includes('dominant') ||
    specialPromptLower.includes('submissive') ||
    specialPromptLower.includes('master') ||
    specialPromptLower.includes('slave') ||
    specialPromptLower.includes('kinky') ||
    specialPromptLower.includes('fetish');

  const isDemonish =
    mainTagLower.includes('demon') ||
    mainTagLower.includes('succubus') ||
    specialPromptLower.includes('demon horns') ||
    specialPromptLower.includes('demonmge') ||
    specialPromptLower.includes('succubus');
  const isLamia =
    mainTagLower.includes('lamia') || specialPromptLower.includes('lamia') || mainTagLower.includes('snake woman') || specialPromptLower.includes('snake woman');
  const hasFangs =
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
  const subjectDescriptor = isMinor ? 'loli, small, mini size, (shortstack:1.6), (child:1.6), tiny size, petite size, petite childlike female, big head' : 'woman';
  const malePartnerPrompt = (!isSelfAction && shouldIncludeMalePartnerFromCurrentText(messageContent)) ? 'male, man' : '';
  const soloDescriptor = hasSexualContent ? '' : 'solo';
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

  const slimeHairStyleMap: Partial<Record<string, string>> = {
    long: 'slime hair, gelatinous hair, liquid slime hair, hair made of slime',
    straight: 'dripping slime hair, melting slime hair, viscous liquid hair, slime hair dripping down shoulders',
    bangs: 'slime tendril hair, pseudopod hair, living slime strands, animated slime hair',
    braids: 'bubble slime hair, gel blob hair, slime bubble crown, amorphous slime hair',
    bun: 'amorphous slime head, no defined hair, smooth slime head, featureless slime hair',
    ponytail: 'floating slime hair, weightless slime hair, levitating gelatinous hair',
    bob: 'color-shifting slime hair, bioluminescent slime hair, reactive slime hair',
  };

  const resolvedHairStyleTag = isSlimeGirl ? slimeHairStyleMap[hairStyle] || '' : hairStyle ? `${hairStyle} hairstyle` : '';
  const hairColor = appearance.hairColor?.toLowerCase() || '';
  const eyeColor = appearance.eyeColor?.toLowerCase() || '';
  const eyeType = appearance.eyeType?.toLowerCase() || '';
  const clothing = appearance.clothing?.toLowerCase() || '';
  const environment = appearance.environment?.toLowerCase().replace('_', ' ') || '';

  // Check if environment is a preset or custom text
  const isPresetEnvironment = Object.values(Environment).includes(appearance.environment as Environment);
  const environmentTag = environment
    ? isPresetEnvironment
      ? `in ${environment} setting`
      : `in ${environment}`
    : '';

  const getPersonalityPromptTags = (): string[] => {
    const tags: string[] = [];

    const archetype = personality.archetype?.toLowerCase() || '';
    const isCustomArchetype = archetype === 'custom';

    const addSplitTags = (value: string) => {
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((tag) => tags.push(tag));
    };

    if (isSpecialCharacter && personality.customSpecialty?.trim()) {
      addSplitTags(personality.customSpecialty);
      return tags;
    }

    if (!isCustomArchetype) {
      switch (archetype) {
        case 'jealous-flame':
          return [
            'jealous expression',
            'possessive',
            'intense gaze',
            'seductive smile',
          ];
        case 'cunning-innocent':
          return [
            'playful expression',
            'mischievous smile',
            'teasing',
            'innocent look',
          ];
        case 'power-play':
          return [
            'dominant',
            'confident',
            'commanding presence',
            'assertive posture',
          ];
        case 'mysterious-lover':
          return [
            'mysterious expression',
            'alluring',
            'soft smile',
            'half-lidded eyes',
          ];
      }
    }

    const traits = personality.traits;
    const low = 35;
    const high = 65;

    if (traits.submissiveDominant <= low) tags.push('submissive', 'shy', 'timid');
    else if (traits.submissiveDominant >= high) tags.push('dominant', 'assertive');

    if (traits.insecureConfident <= low) tags.push('nervous', 'bashful', 'blushing');
    else if (traits.insecureConfident >= high) tags.push('confident', 'self-assured');

    if (traits.coldPassionate <= low) tags.push('cold expression', 'stoic');
    else if (traits.coldPassionate >= high) tags.push('passionate', 'sensual');

    if (traits.reservedOutgoing <= low) tags.push('reserved', 'quiet');
    else if (traits.reservedOutgoing >= high) tags.push('outgoing', 'energetic');

    if (traits.seriousPlayful <= low) tags.push('serious expression', 'calm');
    else if (traits.seriousPlayful >= high) tags.push('playful expression', 'teasing');

    if (personality.customSpecialty?.trim()) {
      addSplitTags(personality.customSpecialty);
    }

    return tags;
  };

  const personalityPromptTags = getPersonalityPromptTags();

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
  const tailColorTag = hairColor && isLamia ? `${hexToColorName(hairColor)} tail` : '';
  const fangsActivationTags = hasFangs
    ? 'sharp fangs, visible fangs, clean sharp teeth, symmetrical teeth, slightly parted lips'
    : '';
  const clothingColorValueRaw = appearance.clothingColor;
  const clothingColorValue = typeof clothingColorValueRaw === 'string' ? clothingColorValueRaw.trim() : '';
  const clothingColorTag = clothingColorValue
    ? normalizeA1111ColorName(clothingColorValue.startsWith('#') ? hexToColorName(clothingColorValue) : clothingColorValue)
    : '';
  const clothingDetails = clothing ? getClothingDetails(clothing, false, draft) : '';
  const clothingDetailsLower = clothingDetails.toLowerCase();
  const clothingColorEnforcementTags = (() => {
    if (!clothingColorTag || !clothingDetailsLower) return '';

    const pieces: string[] = [];
    const addIf = (needle: string, tag: string) => {
      if (clothingDetailsLower.includes(needle)) pieces.push(tag);
    };

    // Bind the (canonicalized) color to likely garment nouns. These weighted tags help SD lock onto the intended clothing color.
    addIf('gown', `(${clothingColorTag} gown:1.6)`);
    addIf('dress', `(${clothingColorTag} dress:1.6)`);
    addIf('bikini', `(${clothingColorTag} bikini:1.5)`);
    addIf('lingerie', `(${clothingColorTag} lingerie:1.5)`);
    addIf('bodysuit', `(${clothingColorTag} bodysuit:1.5)`);
    addIf('latex', `(${clothingColorTag} latex:1.3)`);
    addIf('satin', `(${clothingColorTag} satin:1.3)`);

    if (pieces.length === 0) {
      pieces.push(`(${clothingColorTag} outfit:1.45)`);
    }

    // Extra plain-language anchor.
    pieces.push(`clothing is ${clothingColorTag}`);

    return joinAndDedupeTags(...pieces);
  })();

  const clothingDetailsWithColor = clothingDetails
    ? (clothingColorTag ? `${clothingColorTag} colored ${clothingDetails}` : clothingDetails)
    : '';
  const clothingTag = clothing === ClothingStyle.CUSTOM && appearance.customClothing
    ? `wearing ${appearance.customClothing}`
    : clothing === ClothingStyle.NAKED
      ? getClothingDetails(clothing, false, draft)
      : clothing
        ? `wearing detailed ${clothingDetailsWithColor}`
        : '';
  const hairColorTag = hairColor ? `${hexToColorName(hairColor)} hair` : '';
  const eyeColorTag = eyeColor ? `${eyeColor} eyes` : '';
  const eyeTypeTag = eyeType ? (eyeTypeDescriptions[eyeType] || `${eyeType} eyes`) : '';

  const centaurAnatomy = isCentaur ? 'equine lower body, horse body, four legs, four hooves' : '';
  const arachneCpt = getArachneCptContext(draft);

  const prompt = joinAndDedupeTags(
    stylePrompts[style],
    isSpecialCharacter ? mainTag : '',
    isSpecialCharacter ? loraTags : '',
    isSpecialCharacter ? loraEyes : '',
    fangsActivationTags,
    isSpecialCharacter ? specialPrompt : '',
    centaurAnatomy,
    arachneCpt.enabled ? 'arachnecpt' : '',
    arachneCpt.modifiers,
    malePartnerPrompt,
    soloDescriptor,
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
    clothingColorEnforcementTags,
    resolvedHairStyleTag,
    hairColorTag,
    eyeColorTag,
    eyeTypeTag,
    environmentTag,
    personalityPromptTags.join(', '),
    allAdditionalTags
  );

  return prompt;
};

const buildNegativePrompt = (draft?: CharacterDraft, messageContent?: string): string => {
  const userNegativePrompt = joinAndDedupeTags(draft?.generation?.negativePrompt, draft?.specialNegativePrompt);
  const hasUserNegativePrompt = userNegativePrompt.trim().length > 0;

  // Check if prompt contains sexual content that should allow male presence
  // Check both the AI-extracted content AND the original message content
  const mainTagSexual = (draft?.mainTag || '').toLowerCase();
  const specialPromptSexual = (draft?.specialPrompt || '').toLowerCase();
  const originalMessageContent = (messageContent || '').toLowerCase();

  // Check if it's a self-action to avoid adding male partner for solo activities
  const isSelfActionInNegative =
    mainTagSexual.includes('takes her own') ||
    mainTagSexual.includes('takes his own') ||
    mainTagSexual.includes('her own') ||
    mainTagSexual.includes('his own') ||
    mainTagSexual.includes('herself') ||
    mainTagSexual.includes('himself') ||
    (mainTagSexual.includes('takes') &&
      mainTagSexual.includes('penis') &&
      (mainTagSexual.includes('her') || mainTagSexual.includes('his')) &&
      mainTagSexual.includes('into her mouth')) ||
    ((mainTagSexual.includes('futanari') || specialPromptSexual.includes('futanari')) &&
      (mainTagSexual.includes('blowjob') ||
        mainTagSexual.includes('deepthroat') ||
        mainTagSexual.includes('oral') ||
        specialPromptSexual.includes('blowjob') ||
        specialPromptSexual.includes('deepthroat') ||
        specialPromptSexual.includes('oral'))) ||
    (mainTagSexual.includes('solo') &&
      (mainTagSexual.includes('blowjob') ||
        mainTagSexual.includes('deepthroat') ||
        mainTagSexual.includes('oral') ||
        mainTagSexual.includes('sucking')));

  const hasSexualContent =
    mainTagSexual.includes('oral sex') ||
    mainTagSexual.includes('sex') ||
    mainTagSexual.includes('intercourse') ||
    mainTagSexual.includes('blowjob') ||
    mainTagSexual.includes('deepthroat') ||
    mainTagSexual.includes('fucking') ||
    mainTagSexual.includes('penetration') ||
    mainTagSexual.includes('anal') ||
    mainTagSexual.includes('anal sex') ||
    mainTagSexual.includes('anus') ||
    mainTagSexual.includes('doggy') ||
    mainTagSexual.includes('doggy style') ||
    mainTagSexual.includes('missionary') ||
    mainTagSexual.includes('cowgirl') ||
    mainTagSexual.includes('riding') ||
    mainTagSexual.includes('cock') ||
    mainTagSexual.includes('dick') ||
    mainTagSexual.includes('pussy') ||
    mainTagSexual.includes('cum') ||
    mainTagSexual.includes('cumshot') ||
    mainTagSexual.includes('creampie') ||
    mainTagSexual.includes('facial') ||
    mainTagSexual.includes('handjob') ||
    mainTagSexual.includes('masturbation') ||
    mainTagSexual.includes('orgasm') ||
    mainTagSexual.includes('moaning') ||
    mainTagSexual.includes('breastfeeding') ||
    mainTagSexual.includes('titjob') ||
    mainTagSexual.includes('boobjob') ||
    mainTagSexual.includes('footjob') ||
    mainTagSexual.includes('rimjob') ||
    mainTagSexual.includes('69') ||
    mainTagSexual.includes('sixty nine') ||
    mainTagSexual.includes('threesome') ||
    mainTagSexual.includes('foursome') ||
    mainTagSexual.includes('gangbang') ||
    mainTagSexual.includes('orgy') ||
    mainTagSexual.includes('swallowing') ||
    mainTagSexual.includes('sucking') ||
    mainTagSexual.includes('licking') ||
    mainTagSexual.includes('eating out') ||
    mainTagSexual.includes('cunnilingus') ||
    mainTagSexual.includes('facesitting') ||
    mainTagSexual.includes('queening') ||
    mainTagSexual.includes('spanking') ||
    mainTagSexual.includes('bondage') ||
    mainTagSexual.includes('bdsm') ||
    mainTagSexual.includes('dominant') ||
    mainTagSexual.includes('submissive') ||
    mainTagSexual.includes('master') ||
    mainTagSexual.includes('slave') ||
    mainTagSexual.includes('kinky') ||
    mainTagSexual.includes('fetish') ||
    specialPromptSexual.includes('oral sex') ||
    specialPromptSexual.includes('sex') ||
    specialPromptSexual.includes('intercourse') ||
    specialPromptSexual.includes('blowjob') ||
    specialPromptSexual.includes('deepthroat') ||
    specialPromptSexual.includes('autofellatio') ||
    specialPromptSexual.includes('fucking') ||
    specialPromptSexual.includes('penetration') ||
    specialPromptSexual.includes('anal') ||
    specialPromptSexual.includes('anal sex') ||
    specialPromptSexual.includes('anus') ||
    specialPromptSexual.includes('doggy') ||
    specialPromptSexual.includes('doggy style') ||
    specialPromptSexual.includes('missionary') ||
    specialPromptSexual.includes('cowgirl') ||
    specialPromptSexual.includes('riding') ||
    specialPromptSexual.includes('cock') ||
    specialPromptSexual.includes('dick') ||
    specialPromptSexual.includes('pussy') ||
    specialPromptSexual.includes('cum') ||
    specialPromptSexual.includes('cumshot') ||
    specialPromptSexual.includes('creampie') ||
    specialPromptSexual.includes('facial') ||
    specialPromptSexual.includes('handjob') ||
    specialPromptSexual.includes('masturbation') ||
    specialPromptSexual.includes('orgasm') ||
    specialPromptSexual.includes('moaning') ||
    specialPromptSexual.includes('breastfeeding') ||
    specialPromptSexual.includes('titjob') ||
    specialPromptSexual.includes('boobjob') ||
    specialPromptSexual.includes('footjob') ||
    specialPromptSexual.includes('rimjob') ||
    specialPromptSexual.includes('69') ||
    specialPromptSexual.includes('sixty nine') ||
    specialPromptSexual.includes('threesome') ||
    specialPromptSexual.includes('foursome') ||
    specialPromptSexual.includes('gangbang') ||
    specialPromptSexual.includes('orgy') ||
    specialPromptSexual.includes('swallowing') ||
    specialPromptSexual.includes('sucking') ||
    specialPromptSexual.includes('licking') ||
    specialPromptSexual.includes('eating out') ||
    specialPromptSexual.includes('cunnilingus') ||
    specialPromptSexual.includes('facesitting') ||
    specialPromptSexual.includes('queening') ||
    specialPromptSexual.includes('spanking') ||
    specialPromptSexual.includes('bondage') ||
    specialPromptSexual.includes('bdsm') ||
    specialPromptSexual.includes('dominant') ||
    specialPromptSexual.includes('submissive') ||
    specialPromptSexual.includes('master') ||
    specialPromptSexual.includes('slave') ||
    specialPromptSexual.includes('kinky') ||
    specialPromptSexual.includes('fetish') ||
    originalMessageContent.includes('anus') ||
    originalMessageContent.includes('anal') ||
    originalMessageContent.includes('anal sex') ||
    originalMessageContent.includes('oral sex') ||
    originalMessageContent.includes('blowjob') ||
    originalMessageContent.includes('deepthroat') ||
    originalMessageContent.includes('cock') ||
    originalMessageContent.includes('dick') ||
    originalMessageContent.includes('pussy') ||
    originalMessageContent.includes('sex') ||
    originalMessageContent.includes('intercourse') ||
    originalMessageContent.includes('fucking') ||
    originalMessageContent.includes('penetration') ||
    originalMessageContent.includes('doggy') ||
    originalMessageContent.includes('doggy style') ||
    originalMessageContent.includes('missionary') ||
    originalMessageContent.includes('cowgirl') ||
    originalMessageContent.includes('riding') ||
    originalMessageContent.includes('cum') ||
    originalMessageContent.includes('cumshot') ||
    originalMessageContent.includes('creampie') ||
    originalMessageContent.includes('facial') ||
    originalMessageContent.includes('handjob') ||
    originalMessageContent.includes('masturbation') ||
    originalMessageContent.includes('orgasm') ||
    originalMessageContent.includes('cunnilingus') ||
    originalMessageContent.includes('eating out');

  // Simple negative prompts - let LM Studio handle the specifics
  let contextualNegativePrompts = '';
  if (hasSexualContent && !isSelfActionInNegative) {
    contextualNegativePrompts = '';
  }

  let negativePrompt = hasUserNegativePrompt
    ? userNegativePrompt
    : joinAndDedupeTags(
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
        'extra head',
        hasSexualContent ? 'multiple girls,' : 'multiple people, ',
        'split view',
        'multiple views',
        'multiple panels',
        'collage',
        '2 girls',
        'two girls',
        contextualNegativePrompts
      );

  const extraNegativePrompts: string[] = [];

  // Outfit color drift guard: discourage "gold dress" when a non-gold outfit color is selected.
  const clothingColorRaw = draft?.appearance?.clothingColor;
  const clothingColorValue = typeof clothingColorRaw === 'string' ? clothingColorRaw.trim() : '';
  const clothingColorTag = clothingColorValue
    ? normalizeA1111ColorName(clothingColorValue.startsWith('#') ? hexToColorName(clothingColorValue) : clothingColorValue)
    : '';
  if (clothingColorTag) {
    const lower = clothingColorTag.toLowerCase();
    const allowsGold = lower.includes('gold') || lower.includes('golden') || lower.includes('amber') || lower.includes('yellow');
    if (!allowsGold) {
      extraNegativePrompts.push('gold dress, golden dress, gold gown, golden gown');
    }
  }

  const ageNumber =
    typeof draft?.identity?.age === 'number' && Number.isFinite(draft.identity.age) ? draft.identity.age : null;
  if (!hasUserNegativePrompt && ageNumber !== null) {
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
  const isArachne = hasPromptToken(mainTag, 'arachnecpt') || hasPromptToken(specialPrompt, 'arachnecpt');
  const hasNonHumanLegs = isCentaur || isLamia || isHarpy || isSlimeGirl;

  const isFuta = mainTag.includes('futanari') || specialPrompt.includes('futanari');

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

  if (isCentaur && isFuta) {
    extraNegativePrompts.push(
      'human penis, penis on human body, penis on torso, crotch penis, human genitalia, genitalia on human upper body'
    );
  }

  // Add arachne-specific negative prompts
  if (isArachne) {
    extraNegativePrompts.push(
      'human legs, human feet, feet, bipedal, two legs, two feet, human lower body, human thighs, human calves, high heels'
    );
  }

  const hasFangs =
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

  if (!hasUserNegativePrompt && draft?.generation?.style === CharacterStyle.SPECIAL) {
    negativePrompt = joinAndDedupeTags(
      negativePrompt,
      'bad quality,worst quality,worst detail,sketch,censored,watermark, signature, artist name'
    );
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

const MESSAGE_CAMERA_VARIATIONS: string[] = [
  'eye level shot',
  'three-quarter view',
  'side view',
  'high angle shot',
  'low angle shot',
  'overhead view'
];

const posesIncludeCameraAngle = (poses: string[]): boolean => {
  const joined = poses.map((p) => String(p || '').toLowerCase());
  return joined.some((p) =>
    p.includes('angle') ||
    p.includes('view') ||
    p.includes('shot') ||
    p.includes('perspective') ||
    p.includes('profile') ||
    p.includes('frontal') ||
    p.includes('rear') ||
    p.includes('from behind')
  );
};

const normalizePlannedPoses = (poses: string[], messageContent: string): string[] => {
  const list = Array.isArray(poses) ? [...poses] : [];
  const m = String(messageContent || '').toLowerCase();

  const wantsSitting =
    m.includes('sit') ||
    m.includes('sitting') ||
    m.includes('seated') ||
    m.includes('edge of the bed') ||
    m.includes('edge of bed') ||
    m.includes('bed edge') ||
    m.includes('sit on the bed') ||
    m.includes('sits on the bed');

  const wantsLying =
    m.includes('lie down') ||
    m.includes('lying') ||
    m.includes('laying') ||
    m.includes('prone') ||
    m.includes('lying on stomach') ||
    m.includes('on your stomach') ||
    m.includes('belly down') ||
    m.includes('face down');

  const wantsLegsApart =
    m.includes('legs apart') ||
    m.includes('legs spread') ||
    m.includes('thighs apart') ||
    m.includes('spreads her legs') ||
    m.includes('spreading her legs') ||
    m.includes('spreads her thighs') ||
    m.includes('spreading her thighs') ||
    m.includes('open your legs') ||
    m.includes('open her legs') ||
    m.includes('open legs') ||
    m.includes('legs wide');

  const wantsKneelingOrHaunches =
    m.includes('kneel') ||
    m.includes('kneeling') ||
    m.includes('kneels') ||
    m.includes('haunches') ||
    m.includes('on her haunches') ||
    m.includes('drops down') ||
    m.includes('on knees') ||
    m.includes('on her knees');

  let normalized = list;

  if (wantsSitting && !wantsLying) {
    normalized = normalized.filter((p) => {
      const pl = String(p || '').toLowerCase();
      return !pl.includes('lying') && !pl.includes('laying') && !pl.includes('prone') && !pl.includes('face down');
    });
  }

  if (wantsLying && !wantsSitting) {
    normalized = normalized.filter((p) => {
      const pl = String(p || '').toLowerCase();
      return !pl.includes('sitting') && !pl.includes('seated');
    });
  }

  if (wantsLegsApart) {
    normalized = normalized.filter((p) => {
      const pl = String(p || '').toLowerCase();
      return !pl.includes('legs apart') && !pl.includes('knees apart') && !pl.includes('spread legs');
    });
    normalized.unshift('(legs apart:1.4)', '(knees apart:1.3)', '(spread legs:1.25)', 'sitting with legs apart');
  }

  if (wantsKneelingOrHaunches) {
    normalized.unshift('(on knees:1.4)', '(kneeling:1.3)', '(on haunches:1.3)', '(presenting:1.2)', '(rear view:1.2)', '(from behind:1.1)');
  }

  return normalized;
};

const normalizeMessagePoses = (poses: string[]) => {
  const poseList = Array.isArray(poses) ? [...poses] : [];
  const poseLower = poseList.map((p) => String(p || '').toLowerCase());

  const hasProne = poseLower.some((p) =>
    p.includes('lying on stomach') ||
    p.includes('prone') ||
    p.includes('belly down') ||
    p.includes('face down') ||
    p.includes('stomach on')
  );

  if (!hasProne) {
    return {
      poses: poseList,
      extraNegativePrompt: ''
    };
  }

  const removeIfExact = new Set<string>([
    'lying on back',
    'supine position',
    'reclining pose',
    'reclining',
    'lying down',
    'horizontal pose',
    'laying down pose',
    'back view'
  ]);

  const cleaned = poseList.filter((p) => !removeIfExact.has(String(p || '').toLowerCase()));
  cleaned.unshift('(lying on stomach:1.4)', '(prone position:1.4)', '(face down:1.3)', '(lying face down on bed:1.3)', '(belly on bed:1.2)');

  return {
    poses: cleaned,
    extraNegativePrompt: joinAndDedupeTags(
      'lying on back, on her back, supine position, face up, belly up',
      'reclining, reclining pose, propped up, sitting up, leaning back, leaning on one arm, leaning on elbows, side-lying, lying on side'
    )
  };
};

const sanitizeForProne = (commaTags: string): string => {
  const remove = new Set<string>([
    'lying on back',
    'supine position',
    'reclining pose',
    'reclining',
    'lying down',
    'horizontal pose',
    'laying down pose',
    'back view'
  ]);
  return sanitizeCommaTags(commaTags || '', remove);
};

const buildHandPoseVariation = (draft: CharacterDraft, settings?: any): string => {
  if (settings?.lockPose === true) return '';

  const isArachne = getArachneCptContext(draft).enabled;

  const seedFromSettings =
    !isArachne && typeof settings?.seed === 'number' && Number.isFinite(settings.seed) && settings.seed !== -1 ? settings.seed : undefined;

  // If the user explicitly set a seed, keep pose selection deterministic.
  // Otherwise (seed = -1 / undefined), allow true random variation between generations.
  return pickVariant(
    isArachne ? HAND_POSE_VARIATIONS_ARACHNE : HAND_POSE_VARIATIONS_GENERIC,
    seedFromSettings
  );
};

const buildPromptWithHandPose = (draft: CharacterDraft, style: CharacterStyle, settings?: any): string => {
  return buildPrompt(draft, style, settings);
};

export const automatic1111API = {
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/samplers`);
      return response.ok;
    } catch (error) {
      console.error('Automatic1111 connection check failed:', error);
      return false;
    }
  },

  async switchModel(modelName: string): Promise<boolean> {
    try {
      const resolvedModelName = await resolveSdModelCheckpoint(modelName);

      // Get current options
      const optionsResponse = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/options`);
      if (!optionsResponse.ok) {
        throw new Error('Failed to get options');
      }

      const options = await optionsResponse.json();
      options.sd_model_checkpoint = resolvedModelName;

      // Update options to switch model
      const updateResponse = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/options`, {
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
    const isArachneCpt = getArachneCptContext(draft).enabled;
    const isLamia = mainTag.includes('lamia') || specialPrompt.includes('lamia') || mainTag.includes('snake') || specialPrompt.includes('snake');
    const isSlimeGirl = mainTag.includes('slime girl') || specialPrompt.includes('slime girl') || mainTag.includes('slime') || specialPrompt.includes('slime');
    const isCentaur = mainTag.includes('centaur') || specialPrompt.includes('centaur') || mainTag.includes('taur') || specialPrompt.includes('taur');
    const isHarpy = mainTag.includes('harpy') || specialPrompt.includes('harpy');
    const hasNonHumanLegs = isCentaur || isLamia || isHarpy || isSlimeGirl;

    const aspectRatio = settings?.aspectRatio || 'portrait';
    const isLandscapeOrCinematic = isLandscapeOrCinematicAspectRatio(aspectRatio);

    // Check if character has custom poses and apply them
    const aspectRatioId = normalizeAspectRatioId(aspectRatio);
    const raceType = mainTag || specialPrompt;
    const effectiveRaceType = isArachneCpt ? 'arachne' : raceType;

    if (hasCustomPoses(effectiveRaceType)) {
      const randomPose = getRandomRacePose(effectiveRaceType, aspectRatioId);
      const modifiedDraft = {
        ...draft,
        specialPrompt: joinAndDedupeTags(draft.specialPrompt, poseMentionsHandsOrArms(randomPose) ? '' : randomPose)
      };

      let prompt = buildPrompt(modifiedDraft, style);
      let negativePrompt = buildNegativePrompt(modifiedDraft);

      ({ prompt, negativePrompt } = applyModelPromptDefaults(model, prompt, negativePrompt));

      // Apply model-specific score tags
      if (model === AIModel.CYBERREALISTIC) {
        prompt = `score_9, score_8_up, score_7_up, ${prompt}`;
        negativePrompt = `score_6, score_5, score_4, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), ${negativePrompt}`;
      }

      const payload = applyHiresFixSettings({
        prompt,
        negative_prompt: negativePrompt,
        width: settings?.width || getDimensionsFromAspectRatio(aspectRatio, draft.generation.model).width,
        height: settings?.height || getDimensionsFromAspectRatio(aspectRatio, draft.generation.model).height,
        steps: settings?.steps || 30,
        cfg_scale: settings?.cfgScale || (style === CharacterStyle.SPECIAL ? 6 : 8),
        sampler_name: settings?.sampler || (style === CharacterStyle.SPECIAL ? 'Euler a' : 'DPM++ 2M Karras'),
        model_name: model,
        seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
        override_settings: {
          sd_model_checkpoint: model
        }
      }, settings);

      return automatic1111API.generateImageWithPayload(payload, modifiedDraft, style, model);
    }

    if (hasNonHumanLegs && isLandscapeOrCinematic) {
      const randomPose = NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES[Math.floor(Math.random() * NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES.length)];
      const modifiedDraft = {
        ...draft,
        specialPrompt: joinAndDedupeTags(
          draft.specialPrompt,
          poseMentionsHandsOrArms(randomPose) ? '' : randomPose,
          NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX
        )
      };

      let prompt = buildPrompt(modifiedDraft, style);
      let negativePrompt = buildNegativePrompt(modifiedDraft);

      ({ prompt, negativePrompt } = applyModelPromptDefaults(model, prompt, negativePrompt));

      const extraNegativePrompts = NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_EXTRA_NEGATIVE_PROMPT;
      negativePrompt = joinAndDedupeTags(negativePrompt, extraNegativePrompts);

      // Apply model-specific score tags
      if (model === AIModel.CYBERREALISTIC) {
        prompt = `score_9, score_8_up, score_7_up, ${prompt}`;
        negativePrompt = `score_6, score_5, score_4, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), ${negativePrompt}`;
      }

      const payload = applyHiresFixSettings({
        prompt,
        negative_prompt: negativePrompt,
        width: settings?.width || getDimensionsFromAspectRatio(aspectRatio, model).width,
        height: settings?.height || getDimensionsFromAspectRatio(aspectRatio, model).height,
        steps: settings?.steps || 30,
        cfg_scale: settings?.cfgScale || (style === CharacterStyle.SPECIAL ? 6 : 8),
        sampler_name: settings?.sampler || (style === CharacterStyle.SPECIAL ? 'Euler a' : 'DPM++ 2M Karras'),
        model_name: model,
        seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
        override_settings: {
          sd_model_checkpoint: model
        }
      }, settings);

      return automatic1111API.generateImageWithPayload(payload, modifiedDraft, style, model);
    }

    let prompt = buildPromptWithHandPose(draft, style, settings);
    let negativePrompt = buildNegativePrompt(draft);

    ({ prompt, negativePrompt } = applyModelPromptDefaults(model, prompt, negativePrompt));

    // Apply model-specific score tags
    if (style === CharacterStyle.REALISTIC || model === AIModel.CYBERREALISTIC) {
      prompt = `score_9, score_8_up, score_7_up, ${prompt}`;
      negativePrompt = `score_6, score_5, score_4, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), ${negativePrompt}`;
    }

    const payload = applyHiresFixSettings({
      prompt,
      negative_prompt: negativePrompt,
      width: settings?.width || getDimensionsFromAspectRatio(aspectRatio, model).width,
      height: settings?.height || getDimensionsFromAspectRatio(aspectRatio, model).height,
      steps: settings?.steps || 30,
      cfg_scale: settings?.cfgScale || (style === CharacterStyle.SPECIAL ? 6 : 8),
      sampler_name: settings?.sampler || (style === CharacterStyle.SPECIAL ? 'Euler a' : 'DPM++ 2M Karras'),
      model_name: model,
      seed: settings?.seed === undefined || settings?.seed === null || settings?.seed === -1 ? -1 : settings?.seed,
      override_settings: {
        sd_model_checkpoint: model
      }
    }, settings);

    console.log('[A1111 PAYLOAD] prompt:', prompt);
    console.log('[A1111 PAYLOAD] negative_prompt:', negativePrompt);

    return automatic1111API.generateImageWithPayload(payload, draft, style, model);
  },

  async generateImageWithPayload(payload: any, draft: CharacterDraft, style: CharacterStyle, model: string): Promise<string> {
    try {
      if (payload?.override_settings?.sd_model_checkpoint && typeof payload.override_settings.sd_model_checkpoint === 'string') {
        payload.override_settings.sd_model_checkpoint = await resolveSdModelCheckpoint(payload.override_settings.sd_model_checkpoint);
      }

      const response = await fetch(AUTOMATIC1111_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payload })
      });

      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();

      if (!response.ok) {
        let details = raw;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            details =
              typeof (parsed as any).details === 'string'
                ? (parsed as any).details
                : typeof (parsed as any).message === 'string'
                  ? (parsed as any).message
                  : raw;
          }
        } catch {
          // ignore
        }

        throw new Error(`Automatic1111 API error (${response.status}): ${details || response.statusText}`);
      }

      const result = contentType.includes('application/json') ? JSON.parse(raw) : null;
      if (!result) {
        throw new Error('Automatic1111 API returned a non-JSON response');
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      // Capture seed from API response and save it with the image
      const generatedSeed = result.info ? JSON.parse(result.info).seed : undefined;

      const base64Image = result.images[0];
      const prompt = typeof payload?.prompt === 'string' && payload.prompt.trim().length > 0
        ? payload.prompt
        : buildPrompt(draft, style);

      const uploadResult = await characterAPI.addCharacterImage(
        draft.id!,
        base64Image,
        prompt,
        model,
        style,
        generatedSeed
      );

      if (!uploadResult.success) {
        throw new Error('Failed to add generated image to gallery');
      }

      return uploadResult.data?.imageUrl || '';
    } catch (error) {
      console.error('Error generating character image:', error);
      throw error;
    }
  },

  async generateMessageImage(
    character: CharacterDraft,
    messageContent: string,
    aspectRatio?: string,
    imagePlan?: ImageGenerationPlan,
    intentMessageContent?: string,
    messageId?: string
  ): Promise<string> {
    if (!character.generation?.style || !character.generation?.model) {
      throw new Error('Character style and model must be selected before generation');
    }

    const style = character.generation.style;
    const model = character.generation.model;

    const modelSwitched = await automatic1111API.switchModel(model);
    if (!modelSwitched) {
      console.warn(`Failed to switch to model: ${model}, using current model`);
    }

    const oralIntent = detectOralSexIntentFromMessage(messageContent);
    const allowSexActTags = shouldAllowSexActTagsFromCurrentText(messageContent);
    
    const rawActionsUnfiltered = imagePlan?.actions && imagePlan.actions.length > 0 ? imagePlan.actions : [];
    const rawActions = filterSexActTagsIfNotExplicit(rawActionsUnfiltered, allowSexActTags);
    const rawDetailsUnfiltered = imagePlan?.details && imagePlan.details.length > 0 ? imagePlan.details : [];
    const rawDetails = filterSexActTagsIfNotExplicit(rawDetailsUnfiltered, allowSexActTags);
    const rawEmotionsFull = imagePlan?.emotions && imagePlan.emotions.length > 0 ? imagePlan.emotions : [];
    const rawEmotions = rawEmotionsFull.length > 0 ? [rawEmotionsFull[rawEmotionsFull.length - 1]] : [];
    const rawPosesUnfiltered = imagePlan?.poses && imagePlan.poses.length > 0 ? imagePlan.poses : [];
    const rawPoses = filterSexActTagsIfNotExplicit(rawPosesUnfiltered, allowSexActTags);
    const rawEnvironments = imagePlan?.environments && imagePlan.environments.length > 0 ? imagePlan.environments : [];
    const rawClothing = imagePlan?.clothing && imagePlan.clothing.length > 0 ? imagePlan.clothing : [];
    const rawNegative = imagePlan?.negative && imagePlan.negative.length > 0 ? imagePlan.negative : [];
    const rawCamera = imagePlan?.camera && imagePlan.camera.length > 0 ? imagePlan.camera : [];

    if (rawEmotionsFull.length > 1) {
      console.log('[IMAGE PLAN] normalized emotions (keeping last):', { before: rawEmotionsFull, after: rawEmotions });
    }

    const normalizedPosesResult = normalizeMessagePoses(rawPoses);

    const fallbackEnvironments = (() => {
      const env = String(character.appearance?.environment || '').toLowerCase();
      if (!env) return [] as string[];

      switch (env) {
        case 'bedroom':
          return ['in bedroom', 'bedroom setting', 'on bed'];
        case 'living_room':
          return ['in living room', 'living room setting'];
        case 'kitchen':
          return ['in kitchen', 'kitchen setting'];
        case 'garden':
          return ['in garden', 'garden setting'];
        case 'beach':
          return ['at beach', 'beach setting'];
        case 'forest':
          return ['in forest', 'forest setting'];
        case 'city_street':
          return ['city street', 'street setting'];
        case 'park':
          return ['in park', 'park setting'];
        case 'cafe':
          return ['in cafe', 'cafe setting'];
        case 'library':
          return ['in library', 'library setting'];
        case 'rooftop':
          return ['on rooftop', 'rooftop setting'];
        case 'balcony':
          return ['on balcony', 'balcony setting'];
        case 'mountain':
          return ['in mountains', 'mountain setting'];
        case 'lake':
          return ['by lake', 'lake setting'];
        case 'club':
          return ['in club', 'club setting'];
        case 'restaurant':
          return ['in restaurant', 'restaurant setting'];
        case 'mall':
          return ['in mall', 'mall setting'];
        case 'office':
          return ['in office', 'office setting'];
        case 'gym':
          return ['in gym', 'gym setting'];
        case 'pool':
          return ['at pool', 'poolside'];
        default:
          return [env.replace('_', ' ')];
      }
    })();

    const effectiveEnvironments = rawEnvironments.length > 0 ? rawEnvironments : fallbackEnvironments;
    const hasProne = Boolean(normalizedPosesResult.extraNegativePrompt);

    let clothingPrompt = '';
    if (rawClothing.length > 0) {
      clothingPrompt = rawClothing.join(', ');
    }

    const oralBoostPrompt = oralIntent.explicitOral
      ? joinAndDedupeTags('blowjob', 'licking', 'POV', 'penis')
      : '';

    const customPromptBase = joinAndDedupeTags(
      rawCamera.length > 0 ? rawCamera.join(', ') : '',
      rawActions.length > 0 ? rawActions.join(', ') : '',
      rawDetails.length > 0 ? rawDetails.join(', ') : '',
      normalizedPosesResult.poses.length > 0 ? normalizedPosesResult.poses.join(', ') : '',
      effectiveEnvironments.length > 0 ? effectiveEnvironments.join(', ') : '',
      rawEmotions.length > 0 ? rawEmotions.join(', ') : '',
      clothingPrompt,
      oralBoostPrompt
    );

    const shouldSuppressReferenceSheet = shouldSuppressReferenceSheetFromText(customPromptBase);
    const sanitizedCustomPromptBase = sanitizeCompositionTagsFromPrompt(customPromptBase);

    const wantsPartner =
      !isSelfActionFromCurrentText(messageContent) &&
      (shouldIncludeMalePartnerFromCurrentText(messageContent) || shouldIncludeMalePartnerFromCurrentText(customPromptBase));
    
    // Check if user is present in the scene (non-sexual interaction)
    const hasUserPresent = 
      shouldIncludeUserFromCurrentText(messageContent) || 
      shouldIncludeUserFromCurrentText(customPromptBase);

    const customPrompt = oralIntent.explicitOral
      ? sanitizedCustomPromptBase
      : wantsPartner
        ? ensureCouplePromptTags(sanitizedCustomPromptBase)
        : hasUserPresent
          ? removeCommaTags(sanitizedCustomPromptBase, SOLO_ENFORCING_TAGS_LOWER)
          : ensureSoloPromptTags(sanitizedCustomPromptBase);
    

    console.log(`[PROMPT DEBUG] Custom prompt built: "${customPrompt}"`);

    const varyComposition = effectiveEnvironments.length > 0;
    const baseSpecialPrompt = hasProne
      ? sanitizeForProne(character.specialPrompt || '')
      : (character.specialPrompt || '');

    const messageDraft = {
      ...character,
      generation: {
        ...character.generation,
        seed: varyComposition ? -1 : character.generation.seed
      },
      specialPrompt: joinAndDedupeTags(customPrompt, baseSpecialPrompt),
      specialNegativePrompt: joinAndDedupeTags(
        normalizedPosesResult.extraNegativePrompt,
        rawNegative.length > 0 ? rawNegative.join(', ') : '',
        character.specialNegativePrompt || ''
      )
    };

    if (wantsPartner) {
      messageDraft.specialNegativePrompt = removeCommaTags(messageDraft.specialNegativePrompt, PARTNER_BLOCKING_NEGATIVE_TAGS_LOWER);
      messageDraft.specialNegativePrompt = ensureNoExtraPeopleNegativeTagsForCouple(messageDraft.specialNegativePrompt);
    } else {
      messageDraft.specialNegativePrompt = ensureNoMultiSubjectNegativeTags(messageDraft.specialNegativePrompt);
    }
    if (shouldSuppressReferenceSheet) {
      messageDraft.specialNegativePrompt = ensureNoReferenceSheetNegativeTags(messageDraft.specialNegativePrompt);
    }

    console.log(`[PROMPT DEBUG] Final specialPrompt: "${messageDraft.specialPrompt}"`);

    const preferNonFullBody = shouldPreferNonFullBodyFromCameraTags(rawCamera);
    if (preferNonFullBody) {
      messageDraft.specialPrompt = joinAndDedupeTags('(lower body:1.1)', messageDraft.specialPrompt);
    }

    const payloadForMessage = this.buildPayloadForMessageImage(messageDraft, style, model, aspectRatio, messageContent);
    const imageUrl = await this.generateImageWithPayload(payloadForMessage, messageDraft, style, model);

    if (messageId && imageUrl && imageUrl.length > 0) {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        const updateResult = await characterAPI.updateMessage(messageId, { imageUrl });
        if (updateResult.success) {
          lastError = null;
          break;
        }
        lastError = updateResult.error;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }

      if (lastError) {
        console.error('Failed to attach generated image to message:', lastError);
      }
    }
    return imageUrl;
  },

  buildPayloadForMessageImage(draft: CharacterDraft, style: CharacterStyle, model: string, aspectRatio?: string, messageContent?: string): any {
    const finalAspectRatio = aspectRatio || 'portrait';

    // Create settings object with character's futanari status
    const settings = {
      isFuta: draft.futanari || false,
      seed: draft.generation?.seed === undefined || draft.generation?.seed === null || draft.generation?.seed === -1 ? -1 : draft.generation.seed
    };

    let prompt = buildPrompt(draft, style, settings, messageContent);
    let negativePrompt = buildNegativePrompt(draft, messageContent);

    const cameraLower = String(draft?.specialPrompt || '').toLowerCase();
    const wantsNonFullBody =
      cameraLower.includes('close-up') ||
      cameraLower.includes('close up') ||
      cameraLower.includes('portrait') ||
      cameraLower.includes('upper body') ||
      cameraLower.includes('lower body');
    if (wantsNonFullBody) {
      prompt = removeCommaTags(prompt, new Set<string>(['full body']));
    }

    // Apply model-specific score tags
    if (style === CharacterStyle.REALISTIC || model === AIModel.CYBERREALISTIC) {
      prompt = `score_9, score_8_up, score_7_up, ${prompt}`;
      negativePrompt = `score_6, score_5, score_4, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), ${negativePrompt}`;
    }

    // Use the seed from the first image in the character's gallery for consistency
    const seed = typeof draft.generation?.seed === 'number' && Number.isFinite(draft.generation.seed)
      ? draft.generation.seed
      : -1;
    console.log(`[SEED DEBUG] Using seed: ${seed} for character ${draft.id}`);
    console.log(`[SEED DEBUG] Character generation object:`, draft.generation);

    console.log('[A1111 PAYLOAD] prompt:', prompt);
    console.log('[A1111 PAYLOAD] negative_prompt:', negativePrompt);

    return {
      prompt,
      negative_prompt: negativePrompt,
      width: getDimensionsFromAspectRatio(finalAspectRatio, model).width,
      height: getDimensionsFromAspectRatio(finalAspectRatio, model).height,
      steps: 30,
      cfg_scale: style === CharacterStyle.SPECIAL ? 6 : 8,
      sampler_name: style === CharacterStyle.SPECIAL ? 'Euler a' : 'DPM++ 2M Karras',
      model_name: model,
      seed,
      override_settings: {
        sd_model_checkpoint: model
      }
    };
  },

  async generateDirectImage(payload: any): Promise<string> {
    try {
      const response = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`Automatic1111 API error (${response.status}): ${details || response.statusText}`);
      }

      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      // Upload to Supabase storage with a unique name for message images
      const base64Image = result.images[0];
      const timestamp = Date.now();
      const imageName = `message-${timestamp}-${Math.random().toString(36).substring(7)}.jpg`;

      // Convert base64 to binary data
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(imageName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Return base64 directly (like generateCharacterImage does) instead of URL
      return base64Image;
    } catch (error) {
      console.error('Error generating direct image:', error);
      throw error;
    }
  },

  async generateHiresImage(payload: any): Promise<string> {
    try {
      // Enable hires fix with upscaling
      const preferredUpscaler =
        typeof payload?.hr_upscaler === 'string' && payload.hr_upscaler.trim().length > 0
          ? payload.hr_upscaler
          : 'R-ESRGAN 4x+ Anime6B';

      const makeHiresPayload = (hr_upscaler: string) => ({
        ...payload,
        enable_hr: true,
        hr_scale: 1.5, // Reduced from 2.0 to prevent artifacts
        hr_upscaler,
        hr_second_pass_steps: Math.floor(payload.steps * 0.7), // More steps for better quality
        hr_resize_x: Math.round(payload.width * 1.5),
        hr_resize_y: Math.round(payload.height * 1.5),
        denoising_strength: 0.5, // Reduced from 0.7 to prevent artifacts
      });

      const attempt = async (hr_upscaler: string) => {
        const response = await fetch(`${AUTOMATIC1111_GENERIC_PROXY_PREFIX}/sdapi/v1/txt2img`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(makeHiresPayload(hr_upscaler))
        });

        return { response, hr_upscaler };
      };

      let attemptResult = await attempt(preferredUpscaler);

      if (!attemptResult.response.ok) {
        const message = await attemptResult.response.text().catch(() => '');
        const maybeUpscalerError = message.toLowerCase().includes('could not find upscaler named');
        if (maybeUpscalerError && preferredUpscaler !== 'Latent') {
          attemptResult = await attempt('Latent');
        }
      }

      if (!attemptResult.response.ok) {
        const errorText = await attemptResult.response.text().catch(() => attemptResult.response.statusText);
        throw new Error(
          `Automatic1111 API error (${attemptResult.response.status}): ${errorText}`
        );
      }

      let result;
      try {
        result = await attemptResult.response.json();
      } catch (parseError) {
        console.error('JSON parse error in hires generation:', parseError);
        throw new Error('Failed to parse hires image response - image may be too large. Try reducing steps or disabling hires.');
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      // Upload to Supabase storage with hires prefix
      const base64Image = result.images[0];
      const timestamp = Date.now();
      const imageName = `hires-${timestamp}-${Math.random().toString(36).substring(7)}.jpg`;

      // Convert base64 to binary data
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(imageName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Return base64 directly (like generateCharacterImage does) instead of URL
      return base64Image;
    } catch (error) {
      console.error('Error generating hires image:', error);
      throw error;
    }
  },

  getModelForStyle(style: CharacterStyle): AIModel {
    return STYLE_TO_MODEL_MAP[style];
  }
};