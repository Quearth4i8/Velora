export type AspectRatioId = 'portrait' | 'landscape' | 'square' | 'cinematic' | 'mobile' | 'wide';

export type AspectRatioDefinition = {
  id: AspectRatioId;
  label: string;
  width: number;
  height: number;
  aliases: string[];
};

export const ASPECT_RATIOS: Record<AspectRatioId, AspectRatioDefinition> = {
  portrait: {
    id: 'portrait',
    label: 'Portrait',
    width: 768,
    height: 1024,
    aliases: ['portrait', '9:16'],
  },
  landscape: {
    id: 'landscape',
    label: 'Landscape',
    width: 1024,
    height: 576,
    aliases: ['landscape', '16:9'],
  },
  square: {
    id: 'square',
    label: 'Square',
    width: 896,
    height: 896,
    aliases: ['square', '1:1'],
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    width: 1216,
    height: 704,
    aliases: ['cinematic', '21:9'],
  },
  mobile: {
    id: 'mobile',
    label: 'Mobile',
    width: 832,
    height: 1216,
    aliases: ['mobile', '9:19'],
  },
  wide: {
    id: 'wide',
    label: 'Wide',
    width: 1024,
    height: 768,
    aliases: ['wide', '4:3'],
  },
};

export const normalizeAspectRatioId = (aspectRatio: string | undefined | null): AspectRatioId => {
  const value = String(aspectRatio || '').trim().toLowerCase();
  if (!value) return 'portrait';

  for (const def of Object.values(ASPECT_RATIOS)) {
    if (def.aliases.some((alias) => alias.toLowerCase() === value)) return def.id;
  }

  return 'portrait';
};

export const MODEL_SPECIFIC_RESOLUTIONS: Record<string, Partial<Record<AspectRatioId, { width: number; height: number }>>> = {
  'oneObsession_v18.safetensors': {
    portrait: { width: 768, height: 1344 },
    mobile: { width: 832, height: 1216 },
    landscape: { width: 1344, height: 768 },
    cinematic: { width: 1536, height: 1024 },
    wide: { width: 1280, height: 768 },
    square: { width: 1024, height: 1024 },
  },
  'perfectdeliberate_v30.safetensors': {
    portrait: { width: 960, height: 1440 },
    mobile: { width: 832, height: 1216 },
    landscape: { width: 1440, height: 960 },
    cinematic: { width: 1536, height: 1024 },
    wide: { width: 1216, height: 832 },
    square: { width: 1024, height: 1024 },
  },
  'cyberrealisticPony_v140.safetensors': {
    portrait: { width: 832, height: 1216 },
    mobile: { width: 896, height: 1152 },
    landscape: { width: 1216, height: 832 },
    cinematic: { width: 1344, height: 768 },
    wide: { width: 1152, height: 896 },
    square: { width: 1024, height: 1024 },
  },
};

export const MODEL_DEFAULT_SETTINGS: Record<string, { steps: number; cfgScale: number; sampler: string }> = {
  'perfectdeliberate_v30.safetensors': {
    steps: 35,
    cfgScale: 6,
    sampler: 'Euler a',
  },
  'cyberrealisticPony_v140.safetensors': {
    steps: 30,
    cfgScale: 5,
    sampler: 'DPM++ 2M Karras',
  },
};

export const getDimensionsFromAspectRatio = (aspectRatio: string | undefined | null, model?: string | null): { width: number; height: number } => {
  const id = normalizeAspectRatioId(aspectRatio);

  // Check for model-specific overrides
  if (model && MODEL_SPECIFIC_RESOLUTIONS[model] && MODEL_SPECIFIC_RESOLUTIONS[model][id]) {
    return MODEL_SPECIFIC_RESOLUTIONS[model][id]!;
  }

  return { width: ASPECT_RATIOS[id].width, height: ASPECT_RATIOS[id].height };
};

export const isLandscapeOrCinematicAspectRatio = (aspectRatio: string | undefined | null): boolean => {
  const id = normalizeAspectRatioId(aspectRatio);
  return id === 'landscape' || id === 'cinematic';
};

export const ASPECT_RATIO_OPTIONS: AspectRatioDefinition[] = [
  ASPECT_RATIOS.square,
  ASPECT_RATIOS.landscape,
  ASPECT_RATIOS.portrait,
  ASPECT_RATIOS.cinematic,
  ASPECT_RATIOS.mobile,
  ASPECT_RATIOS.wide,
];

export const NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES: string[] = [
  'lying on her side, full body visible, head resting on arm, relaxed and natural pose, gentle curves',
  'reclining gracefully on her back, arms above head, legs slightly bent, full body in frame, elegant and serene',
  'lying in a lush meadow, entire body shown, one knee raised, peaceful and dreamy expression',
  'curled up slightly on her side, full body portrait, cozy and comfortable position, tail gently wrapped around if applicable',
  'stretched out leisurely on the ground, arms behind head, full body visible, relaxed and carefree stance',
  'lounging naturally on soft grass, one leg extended, the other bent, complete body view, casual and inviting',
  'resting on stomach, chin propped on hands, legs kicked up behind, full body shot, playful and relaxed',

  'sitting with legs extended forward, leaning back on hands, full body visible, relaxed posture',
  'sitting sideways with legs tucked to one side, tail visible, graceful full body pose, elegant and calm',
  'kneeling gently, sitting back on heels, full body in view, serene and traditional pose',
  'leaning against a tree or rock, one leg bent, full body shown, contemplative and natural',
  'sitting cross-legged, hands resting on knees, entire body framed, peaceful meditative pose',

  'walking gracefully toward the viewer, full body stride, gentle motion, wind-swept hair',
  'standing with weight on one leg, hip cocked, full body visible, confident relaxed stance',
  'turning slightly to look over shoulder, full body three-quarter view, elegant twist, flowing hair',
  'reaching upward toward the sky, arms raised, full body stretched, wondrous and free pose',
  'floating gently above ground, lying horizontally in air, full body visible, ethereal and dreamy',

  'lying near a calm lake, reflection visible, full body on the shore, tranquil and reflective',
  'resting among wildflowers, full body surrounded by blooms, soft natural lighting, whimsical pose',
  'basking in sunlight on a hill, lying back with arms spread, complete body basking, warm and joyful',
  'gazing at distant horizon, sitting with knees drawn up, full body silhouette against sky, introspective mood',
];

export const NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_EXTRA_NEGATIVE_PROMPT =
  'standing, standing up, upright, vertical pose, standing position, on legs, walking, running, jumping, sitting, sitting up, partial view, cropped, close-up, upper body only, lower body only, missing parts, incomplete body, cut off, out of frame, hands on ground, all fours, crawling pose, crouching with hands down, kneeling on hands, hands touching floor, on all fours pose, quadruped stance';

export const NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX = 'full body, complete view, entire form';
