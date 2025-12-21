import { CharacterDraft, CharacterStyle, AIModel } from './types';
import { characterAPI } from './api';

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

const getDimensionsFromAspectRatio = (aspectRatio: string) => {
  switch (aspectRatio) {
    case 'portrait':
    case '9:16':
      return { width: 768, height: 1024 };
    case 'landscape':
    case '16:9':
      return { width: 1024, height: 768 };
    case 'square':
    case '1:1':
      return { width: 896, height: 896 };
    case 'cinematic':
    case '21:9':
      return { width: 832, height: 1216 };
    case 'mobile':
    case '9:19':
      return { width: 720, height: 1280 };
    default:
      return { width: 768, height: 1024 };
  }
};

const hashStringToSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
};

const getClothingDetails = (clothing: string, isCharacterGeneration: boolean = true): string => {
  const regularClothingMap: Record<string, string> = {
    'casual': 'jeans and t-shirt',
    'formal': 'elegant dress and high heels',
    'sporty': 'athletic shorts and sports bra',
    'elegant': 'evening gown and jewelry',
    'cute': 'colorful sundress and sandals',
    'edgy': 'leather jacket and ripped jeans',
    'traditional': 'cultural dress with traditional accessories',
    'fantasy': 'magical robes and mystical accessories',
  };

  const nsfwClothingMap: Record<string, string> = {
    'lingerie': 'sexy lingerie set with lace details',
    'naked': 'completely nude, no clothing',
    'bikini': 'revealing bikini, beachwear',
    'underwear': 'sexy underwear set, intimate apparel',
    'revealing': 'revealing outfit, showing skin',
    'bodysuit': 'tight bodysuit, form-fitting',
  };

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

  const push = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
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
    [CharacterStyle.ANIME]: 'lazypos, masterpiece, best quality, ultra-detailed, high quality anime art, illustration, clean lines, vibrant colors, solo character, single person, only one character, perfect hands, detailed fingers, full body portrait',
    [CharacterStyle.REALISTIC]: 'lazypos, masterpiece, best quality, ultra-realistic, photorealistic, professional photography, detailed, high resolution, 8k, solo character, single person, only one character, perfect hands, detailed fingers, full body portrait',
    [CharacterStyle.ARTISTIC]: 'lazypos, masterpiece, best quality, artistic, digital painting, detailed, stunning, high quality, 1 girl, perfect hands, detailed fingers, full body portrait',
  };

  const loraNames = normalizeLoraNames(draft);
  const hasSpecialFields = Boolean(draft.mainTag?.trim() || loraNames.length > 0 || draft.specialPrompt?.trim());
  const isSpecialCharacter = draft.characterType === 'special' || hasSpecialFields;
  const mainTag = draft.mainTag?.trim();
  const specialPrompt = draft.specialPrompt?.trim();

  // Basic characteristics
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

  // Build comprehensive prompt
  let prompt = `${stylePrompts[style]}`;

  if (isSpecialCharacter) {
    if (mainTag) prompt += `, ${mainTag}`;
    if (loraNames.length > 0) {
      prompt += `, ${loraNames.map((name) => buildLoraTag(name, draft.loraWeight)).join(', ')}`;
    }
    if (specialPrompt) prompt += `, ${specialPrompt}`;
  }

  // Add basic info
  if (age) prompt += `, ${age}`;
  if (ethnicity) prompt += `, ${ethnicity}`;
  if (skinTone) {
    const colorName = hexToColorName(skinTone);
    prompt += `, ${colorName} skin`;
  }
  prompt += `, ${subjectDescriptor}`;
  if (ageDescriptor) prompt += `, ${ageDescriptor}`;

  // Add body characteristics
  if (height) prompt += `, ${height}`;
  if (physique) prompt += `, ${physique} body`;
  if (chestSize) prompt += `, ${chestSize} breasts`;

  // Add appearance characteristics
  if (clothing) {
    const detailedClothing = getClothingDetails(clothing, false);
    prompt += `, wearing detailed ${detailedClothing}`;
  }
  if (hairStyle) prompt += `, ${hairStyle} hairstyle`;
  if (hairColor) {
    const hairColorName = hexToColorName(hairColor);
    prompt += `, ${hairColorName} hair`;
  }
  if (eyeColor) prompt += `, ${eyeColor} eyes`;
  if (eyeType) {
    // Make eye type more prominent and descriptive
    const eyeTypeDescriptions: Record<string, string> = {
      'normal': 'normal eyes',
      'siren': 'mesmerizing siren eyes with captivating gaze',
      'fox': 'sharp fox eyes with clever expression',
      'cat': 'alluring cat eyes with slanted pupils',
      'doe': 'gentle doe eyes with innocent look',
      'wolf': 'intense wolf eyes with piercing gaze',
      'eagle': 'sharp eagle eyes with keen vision',
      'dragon': 'mystical dragon eyes with power',
      'big_round': 'big round anime eyes',
      'tareme': 'droopy tareme eyes',
      'tsurime': 'sharp tsurime eyes',
      'half_lidded': 'half-lidded eyes',
      'sleepy': 'sleepy eyes',
      'sparkly': 'sparkly eyes',
      'narrow': 'narrow eyes',
      'piercing': 'piercing eyes',
    };
    const description = eyeTypeDescriptions[eyeType] || `${eyeType} eyes`;
    prompt += `, ${description}`;
  }
  if (environment) prompt += `, in ${environment} setting`;

  // Add personality
  if (personalityDescription) prompt += `, ${personalityDescription} personality`;

  return prompt;
};

const buildNegativePrompt = (draft?: CharacterDraft): string => {
  let negativePrompt = 'lazyneg, low quality, worst quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, deformed, disfigured, malformed, mutated, ugly, disgusting, distorted, bad proportions, extra limbs, missing limbs, fused fingers, too many fingers, long neck, multiple characters, two characters, group, couple, duo, pair, more than one person, multiple people, crowd, friends';

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

  if (draft?.generation?.negativePrompt) extraNegativePrompts.push(draft.generation.negativePrompt);
  if (draft?.characterType === 'special' && draft.specialNegativePrompt) {
    extraNegativePrompts.push(draft.specialNegativePrompt);
  }

  if (extraNegativePrompts.length > 0) {
    negativePrompt += `, ${extraNegativePrompts.join(', ')}`;
  }

  return negativePrompt;
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

    const modelSwitched = await this.switchModel(model);
    if (!modelSwitched) {
      console.warn(`Failed to switch to model: ${model}, using current model`);
    }

    const prompt = buildPrompt(draft, style);
    const negativePrompt = buildNegativePrompt(draft);

    const derivedSeed = typeof draft.id === 'string' && draft.id.length > 0 ? hashStringToSeed(draft.id) : undefined;
    const requestedSeed = settings?.seed;
    const seed =
      requestedSeed === undefined || requestedSeed === null || requestedSeed === -1
        ? derivedSeed ?? -1
        : requestedSeed;

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      width: settings?.width || getDimensionsFromAspectRatio(settings?.aspectRatio || 'portrait').width,
      height: settings?.height || getDimensionsFromAspectRatio(settings?.aspectRatio || 'portrait').height,
      steps: settings?.steps || 30,
      cfg_scale: settings?.cfgScale || 8,
      sampler_name: settings?.sampler || 'DPM++ 2M Karras',
      model_name: model,
      seed,
    };

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
  },

  getModelForStyle(style: CharacterStyle): AIModel {
    return STYLE_TO_MODEL_MAP[style];
  },
};