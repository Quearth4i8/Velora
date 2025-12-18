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
    '#ffe0bd': 'light beige',
    '#800080': 'purple',
    '#c0c0c0': 'silver',
    '#ffd700': 'gold',
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#00ffff': 'cyan',
    '#ffa500': 'orange',
    '#800000': 'maroon',
    '#008000': 'dark green',
    '#000080': 'navy',
    '#808080': 'gray',
    '#ffc0cb': 'pink',
    '#a52a2a': 'brown',
    '#808000': 'olive',
    '#008080': 'teal',
    '#dc143c': 'crimson red',
    '#ff1493': 'deep pink',
    '#ff6347': 'tomato red',
    '#ff4500': 'orange red',
    '#daa520': 'goldenrod',
    '#b8860b': 'dark goldenrod',
    '#d2691e': 'chocolate',
    '#cd853f': 'peru',
    '#8b4513': 'saddle brown',
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

  // For character generation, always use regular clothing
  if (isCharacterGeneration) {
    return regularClothingMap[clothing.toLowerCase()] || 'casual outfit';
  }

  // For wardrobe changes, use the appropriate mapping
  const allClothingMap = { ...regularClothingMap, ...nsfwClothingMap };
  return allClothingMap[clothing.toLowerCase()] || clothing;
};

const buildPrompt = (draft: CharacterDraft, style: CharacterStyle): string => {
  const { identity, body, appearance, personality } = draft;
  
  const stylePrompts = {
    [CharacterStyle.ANIME]: 'lazypos, masterpiece, best quality, ultra-detailed, high quality anime art, illustration, clean lines, vibrant colors, solo character, single person, only one character',
    [CharacterStyle.REALISTIC]: 'lazypos, masterpiece, best quality, ultra-realistic, photorealistic, professional photography, detailed, high resolution, 8k, solo character, single person, only one character',
    [CharacterStyle.ARTISTIC]: 'lazypos, masterpiece, best quality, artistic, digital painting, concept art, detailed, stunning, high quality, solo character, single person, only one character',
  };

  // Basic characteristics
  const age = identity.age ? `${identity.age} years old` : '';
  const ethnicity = identity.ethnicity?.toLowerCase() || '';
  const skinTone = identity.skinTone?.toLowerCase() || '';
  
  // Body characteristics
  const height = body.height?.toLowerCase() || '';
  const physique = body.physique?.toLowerCase() || '';
  const chestSize = body.chestSize?.toLowerCase() || '';
  const buttSize = body.buttSize?.toLowerCase() || '';
  
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
  
  // Add basic info
  if (age) prompt += `, ${age}`;
  if (ethnicity) prompt += ` ${ethnicity}`;
  if (skinTone) {
    const colorName = hexToColorName(skinTone);
    prompt += `, ${colorName} skin`;
  }
  prompt += ` female`;
  
  // Add body characteristics
  if (height) prompt += `, ${height}`;
  if (physique) prompt += ` ${physique}`;
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
    };
    const description = eyeTypeDescriptions[eyeType] || `${eyeType} eyes`;
    prompt += `, ${description}`;
  }
  if (environment) prompt += `, in ${environment} setting`;
  
  // Add personality
  if (personalityDescription) prompt += `, ${personalityDescription} personality`;

  return prompt;
};

const buildNegativePrompt = (): string => {
  return 'lazyneg, low quality, worst quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, deformed, disfigured, malformed, mutated, ugly, disgusting, distorted, bad proportions, extra limbs, missing limbs, fused fingers, too many fingers, long neck, multiple characters, two characters, group, couple, duo, pair, more than one person, multiple people, crowd, friends';
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
      console.error('Error switching model:', error);
      return false;
    }
  },

  async generateCharacterImage(draft: CharacterDraft, settings?: any): Promise<string> {
    console.log('=== generateCharacterImage called ===');
    console.log('Settings parameter:', settings);
    
    if (!draft.generation?.style || !draft.generation?.model) {
      throw new Error('Character style and model must be selected before generation');
    }

    const style = draft.generation.style;
    const model = draft.generation.model;

    console.log(`Generating image with style: ${style}, model: ${model}`);

    // Switch to the correct model before generation
    const modelSwitched = await this.switchModel(model);
    if (!modelSwitched) {
      console.warn(`Failed to switch to model: ${model}, using current model`);
    }

    const prompt = buildPrompt(draft, style);
    const negativePrompt = buildNegativePrompt();

    console.log('Generated prompt:', prompt);
    console.log('Settings received:', settings);

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      width: settings?.width || getDimensionsFromAspectRatio(settings?.aspectRatio || 'portrait').width,
      height: settings?.height || getDimensionsFromAspectRatio(settings?.aspectRatio || 'portrait').height,
      steps: settings?.steps || 30,
      cfg_scale: settings?.cfgScale || 8,
      sampler_name: settings?.sampler || 'DPM++ 2M Karras',
      model_name: model,
      seed: settings?.seed || -1,
    };

    console.log('Final payload:', payload);

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