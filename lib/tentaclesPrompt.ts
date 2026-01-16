import type { CharacterDraft } from '@/lib/types';
import { buildCharacterBasePrompts } from '@/lib/automatic1111';

type BuildTentaclesPromptOptions = {
  character: CharacterDraft;
  action?: string;
  loraName?: string;
  loraWeight?: number;
};

const DEFAULT_LORA_NAME = 'extreme_tentacles';
const DEFAULT_LORA_WEIGHT = 0.7;

const buildLoraTag = (name: string, weight: number) => {
  const safeWeight = Number.isFinite(weight) ? weight : DEFAULT_LORA_WEIGHT;
  return `<lora:${name}:${safeWeight}>`;
};

const stripClothingFromPrompt = (prompt: string) => {
  const p = String(prompt || '');
  if (!p.trim()) return '';

  const parts = p
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const removeIfIncludes = [
    'wearing',
    'outfit',
    'dress',
    'skirt',
    'shirt',
    'pants',
    'jeans',
    'jacket',
    'hoodie',
    'uniform',
    'kimono',
    'bikini',
    'swimsuit',
    'lingerie',
    'underwear',
    'bra',
    'panties',
    'stockings',
    'pantyhose',
    'bodysuit',
    'leotard',
    'corset',
    'armor',
    'armour',
    'robe',
    'coat',
    'gloves',
    'shoes',
    'boots',
    'heels',
    'sneakers',
    'hat',
  ];

  const removeExact = new Set([
    'clothed',
    'fully clothed',
    'naked outfit',
  ]);

  const filtered = parts.filter((tag) => {
    const t = tag.toLowerCase();
    if (removeExact.has(t)) return false;
    return !removeIfIncludes.some((needle) => t.includes(needle));
  });

  return filtered.join(', ');
};

const TENTACLES_NEGATIVE_TAGS = [
  'bad anatomy',
  'bad hands',
  'bad feet',
  'bad proportions',
  'bad perspective',
  'bad face',
  'extra breasts',
  'multiple breasts',
  'three breasts',
  'four breasts',
  'extra nipples',
  'multiple nipples',
  'extra areolae',
  'multiple areolae',
  'deformed',
  'disfigured',
  'mutated',
  'mutation',
  'malformed',
  'fused fingers',
  'missing fingers',
  'extra fingers',
  'extra digits',
  'missing limb',
  'extra limbs',
  'extra arms',
  'extra legs',
  'extra hands',
  'extra feet',
  'long neck',
  'bad neck',
  'bad spine',
  'bad torso',
  'bad hips',
  'bad knees',
  'bad elbows',
  'cross-eye',
  'asymmetrical eyes',
  'blurry',
  'lowres',
  'jpeg artifacts',
  'worst quality',
  'low quality',
  'normal quality',
  'cropped',
  'out of frame',
  'cut off',
  'watermark',
  'signature',
  'artist name',
  'text',
  'logo',
  'ui',
  'interface',
  'censored',
  'mosaic censoring',
  'clothed',
  'clothing',
  'dress',
  'underwear',
  'lingerie',
  'bikini',
  'consensual',
  'happy',
  'smiling',
  'gentle',
  'soft',
];

export const buildTentaclesPrompts = (opts: BuildTentaclesPromptOptions) => {
  const base = buildCharacterBasePrompts(opts.character);
  const basePromptRaw = base.prompt || '';
  const baseNegativeRaw = base.negativePrompt || '';

  const mainTag = String(opts.character?.mainTag || '').toLowerCase();
  const specialPrompt = String(opts.character?.specialPrompt || '').toLowerCase();
  const isCentaur =
    mainTag.includes('centaur') || specialPrompt.includes('centaur') || mainTag.includes('taur') || specialPrompt.includes('taur');
  const isLamia =
    mainTag.includes('lamia') ||
    specialPrompt.includes('lamia') ||
    mainTag.includes('snake') ||
    specialPrompt.includes('snake') ||
    mainTag.includes('naga') ||
    specialPrompt.includes('naga') ||
    mainTag.includes('serpent') ||
    specialPrompt.includes('serpent');

  const basePrompt = stripClothingFromPrompt(basePromptRaw);

  const loraName = (opts.loraName || DEFAULT_LORA_NAME).trim() || DEFAULT_LORA_NAME;
  const loraWeight = typeof opts.loraWeight === 'number' ? opts.loraWeight : DEFAULT_LORA_WEIGHT;

  const action = String(opts.action || '').trim();
  const actionTag = action ? action : 'wrapped and restrained';

  const anatomyTags = [
    isCentaur ? 'centaur, equine lower body, horse body, four legs, four hooves' : '',
    isLamia ? 'lamia, naga, snake tail, serpentine lower body, no legs' : '',
  ]
    .filter((x) => x && x.trim())
    .join(', ');

  const tentacleScene = [
    buildLoraTag(loraName, loraWeight),
    'masterpiece',
    'best quality',
    '1girl',
    'solo',
    'nsfw',
    'look of fear',
    'nude',
    'completely nude',
    'in a cave with many tentacles',
    'tentacles',
    actionTag,
  ].join(', ');

  const prompt = [basePrompt, anatomyTags, tentacleScene].filter((x) => x && x.trim()).join(', ');

  const negative = [
    baseNegativeRaw,
    isCentaur
      ? 'bipedal, human legs, human lower body, only two legs, two legs, two hooves, missing hind legs, missing horse legs, human feet'
      : '',
    isLamia
      ? 'human legs, human feet, feet, bipedal, two legs, two feet, human lower body, legs, calves, thighs'
      : '',
    ...TENTACLES_NEGATIVE_TAGS,
  ]
    .filter((x) => x && x.trim())
    .join(', ');

  return { prompt, negative_prompt: negative };
};
