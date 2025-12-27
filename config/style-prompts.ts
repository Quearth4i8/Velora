import { CharacterStyle } from '@/lib/types';

export const STYLE_PROMPTS: Record<CharacterStyle, string> = {
    [CharacterStyle.ANIME]: 'lazypos, masterpiece, best quality, ultra-detailed, high quality anime art, highres, anime illustration, clean lines, vibrant colors, solo character, single person, only one character, full body',
    [CharacterStyle.REALISTIC]: 'lazypos, masterpiece, best quality, ultra-detailed, high quality, highres, photorealistic, sharp focus, professional photography, solo character, single person, only one character, full body',
    [CharacterStyle.ARTISTIC]: 'lazypos, masterpiece, best quality, newest, absurdres, 8K, ultra-detailed, realistic lighting, shiny skin, high quality digital art, highres, 1girl, full body',
};
