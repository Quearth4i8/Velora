import { CharacterDraft, CharacterStyle, AIModel } from './types';
import { characterAPI } from './api';

const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';

const STYLE_TO_MODEL_MAP: Record<CharacterStyle, AIModel> = {
  [CharacterStyle.ANIME]: AIModel.ONEOBSESSION,
  [CharacterStyle.REALISTIC]: AIModel.CYBERREALISTIC,
  [CharacterStyle.ARTISTIC]: AIModel.PERFECTDELIBERATE,
};

const buildPrompt = (draft: CharacterDraft, style: CharacterStyle): string => {
  const { identity, body, appearance, personality } = draft;
  
  const stylePrompts = {
    [CharacterStyle.ANIME]: 'masterpiece, best quality, ultra-detailed, high quality anime art, illustration, clean lines, vibrant colors',
    [CharacterStyle.REALISTIC]: 'masterpiece, best quality, ultra-realistic, photorealistic, professional photography, detailed, high resolution, 8k',
    [CharacterStyle.ARTISTIC]: 'masterpiece, best quality, artistic, digital painting, concept art, detailed, stunning, high quality',
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
  if (skinTone) prompt += `, ${skinTone} skin`;
  prompt += ` female`;
  
  // Add body characteristics
  if (height) prompt += `, ${height}`;
  if (physique) prompt += ` ${physique}`;
  if (chestSize) prompt += `, ${chestSize} breasts`;
  if (buttSize) prompt += `, ${buttSize} butt`;
  
  // Add appearance characteristics
  if (hairStyle) prompt += `, ${hairStyle} hairstyle`;
  if (hairColor) prompt += `, ${hairColor} hair`;
  if (eyeColor) prompt += `, ${eyeColor} eyes`;
  if (eyeType && eyeType !== 'normal') prompt += `, ${eyeType} eyes`;
  if (clothing) prompt += `, wearing ${clothing} clothing`;
  
  // Add personality
  if (personalityDescription) prompt += `, ${personalityDescription} personality`;
  
  // Add quality and composition details
  prompt += `, beautiful, detailed face, front view, facing camera, full body portrait, high quality, detailed`;

  return prompt;
};

const buildNegativePrompt = (): string => {
  return 'low quality, worst quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, deformed, disfigured, malformed, mutated, ugly, disgusting, distorted, bad proportions, extra limbs, missing limbs, fused fingers, too many fingers, long neck';
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

  async generateCharacterImage(draft: CharacterDraft): Promise<string> {
    if (!draft.generation?.style || !draft.generation?.model) {
      throw new Error('Character style and model must be selected before generation');
    }

    const style = draft.generation.style;
    const model = draft.generation.model;

    const prompt = buildPrompt(draft, style);
    const negativePrompt = buildNegativePrompt();

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      width: 768,
      height: 1024,
      steps: 30,
      cfg_scale: 8,
      sampler_name: 'DPM++ 2M Karras',
      model_name: model,
      seed: -1,
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