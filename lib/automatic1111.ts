import { CharacterDraft, CharacterStyle, AIModel } from './types';
import { characterAPI } from './api';
import {
  getDimensionsFromAspectRatio,
  isLandscapeOrCinematicAspectRatio,
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES,
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_EXTRA_NEGATIVE_PROMPT,
  NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX,
} from '@/config/aspect-ratios';

const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';

const STYLE_TO_MODEL_MAP: Record<CharacterStyle, AIModel> = {
  [CharacterStyle.ANIME]: AIModel.ONEOBSESSION,
  [CharacterStyle.REALISTIC]: AIModel.CYBERREALISTIC,
  [CharacterStyle.ARTISTIC]: AIModel.PERFECTDELIBERATE,
};

const hexToColorName = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#fff4e8': 'porcelain',
    '#ffe0bd': 'light beige',
    '#ffcd94': 'light tan',
    '#eac086': 'warm beige',
    '#e0ac69': 'tan',
    '#d99e6c': 'medium tan',
    '#c58c6b': 'deep tan',
    '#b97c4b': 'caramel',
    '#a57c5a': 'brown',
    '#8d5524': 'deep brown',
    '#6b4423': 'dark brown',
    '#4a2c1a': 'very dark brown',
    '#800080': 'purple',
    '#c0c0c0': 'silver',
    '#ffd700': 'blonde',
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#dc143c': 'red',
    '#800000': 'maroon',
    '#ff69b4': 'pink',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#ff6347': 'tomato red',
    '#ff4500': 'orange red',
    '#daa520': 'goldenrod',
    '#b8860b': 'dark goldenrod',
    '#d2691e': 'chocolate',
    '#cd853f': 'peru',
    '#8b4513': 'brown',
    '#2c1b0f': 'dark brown',
    '#c68642': 'light brown',
    '#f8f6e7': 'platinum blonde',
    '#ff8c00': 'orange',
    '#40e0d0': 'turquoise',
    '#a52a2a': 'auburn',
    '#008000': 'green',
    '#008080': 'teal',
    '#808080': 'gray',
    '#a0522d': 'sienna',
    '#708090': 'slate gray',
    '#778899': 'light slate gray',
    '#b0c4de': 'light steel blue',
    '#4682b4': 'steel blue',
    '#6495ed': 'cornflower blue',
    '#191970': 'midnight blue',
    '#4b0082': 'indigo',
    '#8a2be2': 'blue violet',
    '#9400d3': 'dark violet',
    '#9932cc': 'dark orchid',
    '#ba55d3': 'medium orchid',
    '#da70d6': 'orchid',
    '#ee82ee': 'violet',
    '#d8bfd8': 'thistle',
    '#c71585': 'medium violet red',
    '#db7093': 'pale violet red',
    '#ffb6c1': 'light pink',
    '#ffdab9': 'peach puff',
    '#ffe4b5': 'moccasin',
    '#ffdead': 'navajo white',
    '#f0e68c': 'khaki',
    '#e6e6fa': 'lavender',
    '#dcdcdc': 'light gray',
    '#d3d3d3': 'light gray',
    '#696969': 'dim gray',
    '#2f4f4f': 'dark slate gray',
  };
  return colorMap[hex.toLowerCase()] || hex;
};

const hashStringToSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
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

  const regularHumanoidClothingMap: Record<string, string> = {
    casual: 'jeans and t-shirt',
    formal: 'elegant dress and high heels',
    sporty: 'athletic shorts and sports bra',
    elegant: 'evening gown and jewelry',
    cute: 'colorful sundress and sandals',
    edgy: 'leather jacket and ripped jeans',
    traditional: 'cultural dress with traditional accessories',
    fantasy: 'magical robes and mystical accessories',
  };

  const regularCentaurClothingMap: Record<string, string> = {
    casual: 'comfortable tunic top with belt, light cloak, and decorative tack accents',
    formal: 'elegant fitted bodice with flowing drapes and ornate jewelry, refined ceremonial tack',
    sporty: 'supportive athletic top with wrap straps, lightweight harness, and practical accessories',
    elegant: 'flowing gown-like drapes over the upper body with luxurious jewelry and embroidered fabric',
    cute: 'colorful dress-like top with ribbons, soft shawl, and playful accessories',
    edgy: 'leather jacket and rugged accessories, arm wraps, and bold metal details',
    traditional: 'traditional upper garments with cultural accessories and patterned fabrics',
    fantasy: 'enchanted robes and mystical accessories, ornamental barding and charms',
  };

  const regularLeglessClothingMap: Record<string, string> = {
    casual: 'relaxed top with layered wraps and simple accessories',
    formal: 'elegant upper outfit with flowing fabric wraps and refined jewelry',
    sporty: 'supportive athletic top with streamlined wraps and practical accessories',
    elegant: 'luxurious draped outfit with ornate jewelry and flowing fabrics',
    cute: 'colorful outfit with ribbons and decorative accessories',
    edgy: 'leather jacket with bold accessories and layered wraps',
    traditional: 'cultural garments with traditional accessories and patterned fabrics',
    fantasy: 'magical robes and mystical accessories with flowing fabric and charms',
  };

  const nsfwHumanoidClothingMap: Record<string, string> = {
    lingerie:
      'ultra-sheer lace lingerie, completely transparent babydoll, open-cup bra, crotchless garter belt with stockings, tiny g-string thong barely covering anything, nipples and pussy visible through fabric, extreme see-through material',
    naked: 'completely nude, fully naked body, no clothing whatsoever, totally exposed breasts and genitals, bare skin only, explicit nudity',
    bikini:
      'extreme micro bikini, strings-only bikini, pasties and g-string, massive sideboob and underboob, thong bottom disappearing between labia, sheer wet fabric clinging to nipples and pussy outline, practically nude',
    underwear:
      'open-cup sheer bra with exposed nipples, crotchless lace panties, transparent cupless teddy, fishnet crotchless set, labia and nipples fully visible, barely-there straps, erotic intimate apparel leaving nothing to imagination',
    revealing:
      'completely see-through outfit, transparent mesh dress with no underwear, extreme deep plunging neckline to navel, massive cleavage spill, sideboob and underboob fully exposed, backless and crotchless design, clothing optionally dissolved or torn for extra exposure',
    bodysuit:
      'ultra-transparent sheer bodysuit, full fishnet bodysuit with large holes exposing nipples and pussy, crotchless and open-chest design, strategic cutouts over breasts and genitals, glossy wet-look latex bodysuit clinging to every curve, nipples and labia clearly outlined',
    crotchless:
      'crotchless lace panties with sheer straps, revealing lingerie details, explicit open-crotch design, sensual intimate wear',
    'nipple-pasties':
      'nipple pasties covering nipples only, otherwise topless, minimal straps and accessories, provocative minimalist lingerie',
  };

  const nsfwCentaurClothingMap: Record<string, string> = {
    lingerie: 'sheer lace lingerie for the upper body, decorative harness straps, jewelry, and elegant draped fabric accents',
    naked: 'completely nude body, no clothing whatsoever, bare skin only',
    bikini: 'minimal string bikini top, decorative straps, and stylish body jewelry with draped fabric accents',
    underwear: 'revealing lingerie top with delicate straps, decorative harness, and jewelry accents',
    revealing: 'extremely revealing sheer outfit with translucent fabric and bold cutouts, decorative straps and jewelry',
    bodysuit: 'sheer bodysuit-like upper garment with cutouts, glossy fabric, and decorative harness straps',
    crotchless: 'decorative harness straps and revealing lingerie accents for the upper body, bold jewelry and draped fabric',
    'nipple-pasties': 'nipple pasties covering nipples only, otherwise topless upper body, minimal straps, body jewelry',
  };

  const nsfwLeglessClothingMap: Record<string, string> = {
    lingerie: 'sheer lace lingerie for the upper body with delicate straps, jewelry, and elegant wrap accents',
    naked: 'completely nude body, no clothing whatsoever, bare skin only',
    bikini: 'minimal string bikini top with decorative straps and stylish jewelry accents',
    underwear: 'revealing lingerie top with delicate straps and jewelry accents',
    revealing: 'extremely revealing sheer outfit with translucent fabric and bold cutouts, accent jewelry and wraps',
    bodysuit: 'sheer bodysuit-like upper garment with cutouts and glossy fabric, paired with wrap accents',
    crotchless: 'revealing lingerie top with delicate straps and jewelry, paired with decorative wrap accents',
    'nipple-pasties': 'nipple pasties covering nipples only, otherwise topless upper body, minimal straps and jewelry accents',
  };

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

  const stylePrompts = {
    [CharacterStyle.ANIME]: 'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, anime art, illustration, clean lineart, vibrant colors, solo, full body',
    [CharacterStyle.REALISTIC]: 'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, photorealistic, professional photography, sharp focus, solo, full body',
    [CharacterStyle.ARTISTIC]: 'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, digital painting, concept art, detailed, solo, full body',
  };

  const mainTag = draft.mainTag?.trim();
  const specialPrompt = draft.specialPrompt?.trim();

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
  const ethnicity = identity.ethnicity?.toLowerCase() || '';
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

  const eyeTypeDescriptions: Record<string, string> = {
    'normal': 'standard eyes, natural eye shape, balanced proportions, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
    'siren': 'siren eyes, sultry elongated almond-shaped eyes, seductive smoky eyeliner, lifted outer corners, dramatic winged liner extending inward and outward, smudged dark eyeshadow, intense captivating gaze, mysterious alluring expression, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'fox': 'fox eyes, sharp upturned almond-shaped eyes, clever feline gaze, lifted outer corners with straight angled eyeliner, elongated eye shape, sly seductive expression, high arched brows, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'cat': 'cat eyes, sharp upturned eyes with dramatic winged eyeliner, feline slanted shape, alluring playful gaze, thick eyeliner flick, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'doe': 'doe eyes, large round wide-open eyes, innocent gentle gaze, big rounded shape with soft eyeliner, fluttery lashes, youthful wide-eyed look, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'wolf': 'wolf eyes, intense narrow piercing eyes, sharp slanted shape, predatory fierce gaze, glowing or amber tones optional, wild untamed expression, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'eagle': 'eagle eyes, sharp keen hawk-like eyes, narrow focused gaze, high detail with strong brow emphasis, piercing vigilant expression, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'dragon': 'dragon eyes, mystical slit pupils, reptilian vertical pupils, powerful intense gaze, glowing irises optional, sharp angular shape, ancient mythical expression, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details',
    'big_round': 'big round anime eyes, large circular eyes, oversized sparkling round pupils, cute expressive anime style, highly detailed highlights, beautiful detailed eyes, perfect symmetrical eyes',
    'tareme': 'tareme eyes, droopy downturned eyes, soft gentle downward-slanting outer corners, moe innocent look, rounded drooping shape, beautiful detailed eyes, perfect symmetrical eyes',
    'tsurime': 'tsurime eyes, sharp upturned eyes, upward-slanting outer corners with pointed ends, confident strong-willed look, angular fierce shape, beautiful detailed eyes, perfect symmetrical eyes',
    'half_lidded': 'half-lidded eyes, lazy seductive partially closed eyelids, relaxed sleepy gaze, heavy lids covering part of iris, beautiful detailed eyes, perfect symmetrical eyes',
    'sleepy': 'sleepy eyes, droopy heavy-lidded eyes, tired relaxed expression, narrow half-closed shape with soft downward curve, beautiful detailed eyes, perfect symmetrical eyes',
    'sparkly': 'sparkly eyes, shining glittering highlights, multiple star-shaped sparkles in pupils, vibrant expressive anime-style gleam, beautiful detailed eyes with radiant reflections, perfect symmetrical eyes',
    'narrow': 'narrow eyes, slim slitted eye shape, suspicious or calm intense gaze, thin elongated lids, beautiful detailed eyes, perfect symmetrical eyes',
    'piercing': 'piercing eyes, sharp intense staring gaze, focused penetrating look, high contrast highlights on pupils, beautiful detailed eyes, perfect symmetrical eyes, clear sharp pupils',
  };

  const loraTags =
    loraNames.length > 0
      ? loraNames
          .map((name) => (name === 'fangs.safetensors' ? buildLoraTag(name, 1) : buildLoraTag(name, draft.loraWeight)))
          .join(', ')
      : '';
  const loraEyes = loraNames.includes('Eyes.safetensors') ? 'loraeyes' : '';

  const skinToneTag = skinTone ? `${hexToColorName(skinTone)} skin` : '';
  const hornColorTag = skinTone && isDemonish ? `${hexToColorName(skinTone)} horns` : '';
  const fangsActivationTags = hasFangs ? 'fangs, teeth, mouth, open mouth, perfect teeth, detailed teeth' : '';
  const clothingTag = clothing ? `wearing detailed ${getClothingDetails(clothing, false, draft)}` : '';
  const hairColorTag = hairColor ? `${hexToColorName(hairColor)} hair` : '';
  const eyeColorTag = eyeColor ? `${eyeColor} eyes` : '';
  const eyeTypeTag = eyeType ? (eyeTypeDescriptions[eyeType] || `${eyeType} eyes`) : '';
  const environmentTag = environment ? `in ${environment} setting` : '';

  const centaurAnatomy = isCentaur ? 'equine lower body, horse body, four legs, four hooves' : '';

  return joinAndDedupeTags(
    stylePrompts[style],
    isSpecialCharacter ? mainTag : '',
    isSpecialCharacter ? loraTags : '',
    isSpecialCharacter ? loraEyes : '',
    isSpecialCharacter ? specialPrompt : '',
    centaurAnatomy,
    age,
    ethnicity,
    skinToneTag,
    hornColorTag,
    fangsActivationTags,
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

  // Characters with non-human legs need special handling for landscape/cinematic views
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

  if (draft?.generation?.negativePrompt) extraNegativePrompts.push(draft.generation.negativePrompt);
  if (draft?.specialNegativePrompt) extraNegativePrompts.push(draft.specialNegativePrompt);

  if (extraNegativePrompts.length > 0) {
    negativePrompt = joinAndDedupeTags(negativePrompt, extraNegativePrompts.join(', '));
  }

  return dedupeCommaTags(negativePrompt);
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
    const hasNonHumanLegs = isCentaur || isLamia || isHarpy || isSlimeGirl;

    const aspectRatio = settings?.aspectRatio || 'portrait';
    const isLandscapeOrCinematic = isLandscapeOrCinematicAspectRatio(aspectRatio);

    // For non-human leg characters in landscape/cinematic, force varied, natural poses
    if (hasNonHumanLegs && isLandscapeOrCinematic) {
      const randomPose =
        NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES[
          Math.floor(Math.random() * NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_VARIED_POSES.length)
        ];

      // Create a modified draft with varied laying down pose
      const modifiedDraft = {
        ...draft,
        specialPrompt: (draft.specialPrompt || '') + `, ${randomPose}, ${NON_HUMAN_LEGS_LANDSCAPE_CINEMATIC_PROMPT_SUFFIX}`
      };

      const prompt = buildPrompt(modifiedDraft, style);
      const negativePrompt = buildNegativePrompt(modifiedDraft);

      // Add extra negative prompts to prevent standing and ensure full body
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

      return automatic1111API.generateImageWithPayload(payload, draft, style, model);
    }

    // Normal generation for other cases
    const prompt = buildPrompt(draft, style);
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
  }, // Added a comma here

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
      const prompt = buildPrompt(draft, style);
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