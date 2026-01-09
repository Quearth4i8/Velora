import { AgeGroup, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, HairColor, EyeColor, CharacterStyle } from '@/lib/types';
import { RACE_DEFINITIONS } from './race-definitions';

type LoraPreset = {
  id: string;
  label: string;
  description?: string;
  mainTag?: string;
  specialPrompt?: string;
  specialNegativePrompt?: string;
  loraNames?: string[];
  loraName?: string;
  loraWeight?: number | null;
  imageSrc?: string;
};

export const DEFAULT_SKIN_TONE_OPTIONS = [
  '#FFFFFF',
  '#FFF4E8',
  '#FFE0BD',
  '#FFCD94',
  '#EAC086',
  '#E0AC69',
  '#D99E6C',
  '#C58C6B',
  '#B97C4B',
  '#A57C5A',
  '#8D5524',
  '#6B4423',
  '#4A2C1A',
  '#C0C0C0',
  '#808080',
];

export const RACE_SKIN_TONE_OPTIONS: Record<string, string[]> = {
  demon: ['#FFFFFF', '#FF0000', '#DC143C', '#800000', '#800080', '#4B0082', '#2F4F4F', '#000000'],
  succubus: ['#FFFFFF', '#800080', '#4B0082', '#0000FF', '#191970', '#DC143C', '#000000'],
  'goblin-girl': ['#FFFFFF', '#00FF00', '#008000', '#008080', '#2F4F4F', '#A52A2A'],
  'slime-girl': [
    '#87CEEB',
    '#ADD8E6',
    '#B0E0E6',
    '#40E0D0',
    '#00CED1',
    '#AFEEEE',
    '#7FFFD4',
    '#66CDAA',
    '#20B2AA',
    '#008B8B',
    '#00FFFF',
    '#E0FFFF',
    '#FF69B4',
    '#FFB6C1',
    '#FFC0CB',
    '#9370DB',
    '#BA55D3',
    '#DDA0DD',
    '#EE82EE',
    '#DA70D6',
  ],
};

export const getSkinToneOptionsForRace = (raceId?: string, mainTag?: string): string[] => {
  const normalizedRaceId = typeof raceId === 'string' ? raceId.trim().toLowerCase() : '';
  if (normalizedRaceId && RACE_SKIN_TONE_OPTIONS[normalizedRaceId]) {
    return RACE_SKIN_TONE_OPTIONS[normalizedRaceId];
  }

  const normalizedMainTag = typeof mainTag === 'string' ? mainTag.trim().toLowerCase() : '';
  if (normalizedMainTag) {
    if (RACE_SKIN_TONE_OPTIONS[normalizedMainTag]) return RACE_SKIN_TONE_OPTIONS[normalizedMainTag];
    if (normalizedMainTag === 'goblin girl' || normalizedMainTag.includes('goblin')) {
      return RACE_SKIN_TONE_OPTIONS['goblin-girl'];
    }
  }

  return DEFAULT_SKIN_TONE_OPTIONS;
};

export const CHARACTER_CONFIG = {
  ageGroups: [
    { label: '18+', value: AgeGroup.EIGHTEEN_PLUS },
    { label: '20s', value: AgeGroup.TWENTIES },
    { label: '30s', value: AgeGroup.THIRTIES },
    { label: '40s', value: AgeGroup.FORTIES },
    { label: '50s', value: AgeGroup.FIFTIES },
    { label: 'Custom Age', value: AgeGroup.CUSTOM },
  ],

  ethnicities: [
    { label: 'East Asian', value: Ethnicity.EAST_ASIAN },
    { label: 'Korean', value: Ethnicity.KOREAN },
    { label: 'Japanese', value: Ethnicity.JAPANESE },
    { label: 'Brazilian', value: Ethnicity.BRAZILIAN },
    { label: 'Colombian', value: Ethnicity.COLOMBIAN },
    { label: 'Latin American', value: Ethnicity.LATIN_AMERICAN },
    { label: 'Russian', value: Ethnicity.RUSSIAN },
    { label: 'Ukrainian', value: Ethnicity.UKRAINIAN },
    { label: 'Scandinavian', value: Ethnicity.SCANDINAVIAN },
    { label: 'Italian', value: Ethnicity.ITALIAN },
    { label: 'Lebanese', value: Ethnicity.LEBANESE },
    { label: 'Mixed / Exotic', value: Ethnicity.MIXED_EXOTIC },
  ],

  heights: [
    { label: 'Tiny', value: Height.TINY },
    { label: 'Childlike', value: Height.CHILDLIKE },
    { label: 'Petite', value: Height.PETITE },
    { label: 'Small', value: Height.SMALL },
    { label: 'Average', value: Height.AVERAGE },
    { label: 'Tall', value: Height.TALL },
  ],

  physiques: [
    { label: 'Childlike', value: Physique.CHILDLIKE },
    { label: 'Petite', value: Physique.PETITE },
    { label: 'Slim', value: Physique.SLIM },
    { label: 'Athletic', value: Physique.ATHLETIC },
    { label: 'Thicc', value: Physique.THICC },
    { label: 'Curvy', value: Physique.CURVY },
    { label: 'BBW', value: Physique.BBW },
  ],

  chestSizes: [
    { label: 'Flat', value: ChestSize.FLAT },
    { label: 'Small', value: ChestSize.SMALL },
    { label: 'Average', value: ChestSize.AVERAGE },
    { label: 'Big', value: ChestSize.BIG },
    { label: 'Huge', value: ChestSize.HUGE },
  ],

  buttSizes: [
    { label: 'Flat', value: ButtSize.FLAT },
    { label: 'Small', value: ButtSize.SMALL },
    { label: 'Average', value: ButtSize.AVERAGE },
    { label: 'Big', value: ButtSize.BIG },
    { label: 'Huge', value: ButtSize.HUGE },
  ],

  hairStyles: [
    { label: 'Straight', value: HairStyle.STRAIGHT },
    { label: 'Long', value: HairStyle.LONG },
    { label: 'Bangs', value: HairStyle.BANGS },
    { label: 'Braids', value: HairStyle.BRAIDS },
    { label: 'Curly', value: HairStyle.CURLY },
    { label: 'Bun', value: HairStyle.BUN },
    { label: 'Ponytail', value: HairStyle.PONYTAIL },
    { label: 'Bob', value: HairStyle.BOB },
  ],

  hairColors: [
    { label: 'Black', value: HairColor.BLACK },
    { label: 'Dark Brown', value: HairColor.DARK_BROWN },
    { label: 'Brown', value: HairColor.BROWN },
    { label: 'Light Brown', value: HairColor.LIGHT_BROWN },
    { label: 'Blonde', value: HairColor.BLONDE },
    { label: 'Platinum Blonde', value: HairColor.PLATINUM_BLONDE },
    { label: 'White', value: HairColor.WHITE },
    { label: 'Red', value: HairColor.RED },
    { label: 'Maroon', value: HairColor.MAROON },
    { label: 'Auburn', value: HairColor.AUBURN },
    { label: 'Orange', value: HairColor.ORANGE },
    { label: 'Purple', value: HairColor.PURPLE },
    { label: 'Pink', value: HairColor.PINK },
    { label: 'Blue', value: HairColor.BLUE },
    { label: 'Teal', value: HairColor.TEAL },
    { label: 'Green', value: HairColor.GREEN },
    { label: 'Turquoise', value: HairColor.TURQUOISE },
    { label: 'Silver', value: HairColor.SILVER },
    { label: 'Gray', value: HairColor.GRAY },
    { label: 'Lavender', value: HairColor.LAVENDER },
  ],

  eyeColors: [
    { label: 'Brown', value: EyeColor.BROWN },
    { label: 'Blue', value: EyeColor.BLUE },
    { label: 'Green', value: EyeColor.GREEN },
    { label: 'Hazel', value: EyeColor.HAZEL },
    { label: 'Gray', value: EyeColor.GRAY },
    { label: 'Amber', value: EyeColor.AMBER },
    { label: 'Violet', value: EyeColor.VIOLET },
  ],

  personalityArchetypes: [
    {
      id: 'jealous-flame',
      name: 'Jealous Flame',
      description: 'Passionate & Possessive',
      traits: {
        submissiveDominant: 30,
        insecureConfident: 40,
        coldPassionate: 95,
        reservedOutgoing: 80,
        seriousPlayful: 35,
      },
    },
    {
      id: 'cunning-innocent',
      name: 'Cunning Innocent',
      description: 'Playful & Mysterious',
      traits: {
        submissiveDominant: 45,
        insecureConfident: 60,
        coldPassionate: 55,
        reservedOutgoing: 70,
        seriousPlayful: 85,
      },
    },
    {
      id: 'power-play',
      name: 'Power Play',
      description: 'Dominant & Commanding',
      traits: {
        submissiveDominant: 90,
        insecureConfident: 95,
        coldPassionate: 70,
        reservedOutgoing: 85,
        seriousPlayful: 50,
      },
    },
    {
      id: 'mysterious-lover',
      name: 'Mysterious Lover',
      description: 'Enigmatic & Alluring',
      traits: {
        submissiveDominant: 50,
        insecureConfident: 70,
        coldPassionate: 75,
        reservedOutgoing: 40,
        seriousPlayful: 60,
      },
    },
  ],

  personalityTraits: [
    {
      id: 'submissiveDominant',
      label: 'Submissive ↔ Dominant',
      leftLabel: 'Submissive',
      rightLabel: 'Dominant',
      min: 0,
      max: 100,
      default: 50,
    },
    {
      id: 'insecureConfident',
      label: 'Insecure ↔ Confident',
      leftLabel: 'Insecure',
      rightLabel: 'Confident',
      min: 0,
      max: 100,
      default: 50,
    },
    {
      id: 'coldPassionate',
      label: 'Cold ↔ Passionate',
      leftLabel: 'Cold',
      rightLabel: 'Passionate',
      min: 0,
      max: 100,
      default: 50,
    },
    {
      id: 'reservedOutgoing',
      label: 'Reserved ↔ Outgoing',
      leftLabel: 'Reserved',
      rightLabel: 'Outgoing',
      min: 0,
      max: 100,
      default: 50,
    },
    {
      id: 'seriousPlayful',
      label: 'Serious ↔ Playful',
      leftLabel: 'Serious',
      rightLabel: 'Playful',
      min: 0,
      max: 100,
      default: 50,
    },
  ],

  imageStylePresets: {
    [CharacterStyle.ANIME]: Object.entries(RACE_DEFINITIONS[CharacterStyle.ANIME].races).map(([id, def]) => ({
      id,
      ...def,
    })) as LoraPreset[],
    [CharacterStyle.ANIME_ILLUSTRIOUS]: Object.entries(RACE_DEFINITIONS[CharacterStyle.SPECIAL].races).map(([id, def]) => ({
      id,
      ...def,
    })) as LoraPreset[],
    [CharacterStyle.ARTISTIC]: Object.entries(RACE_DEFINITIONS[CharacterStyle.ARTISTIC].races).map(([id, def]) => ({
      id,
      ...def,
    })) as LoraPreset[],
    [CharacterStyle.REALISTIC]: Object.entries(RACE_DEFINITIONS[CharacterStyle.REALISTIC].races).map(([id, def]) => ({
      id,
      ...def,
    })) as LoraPreset[],
    [CharacterStyle.SPECIAL]: Object.entries(RACE_DEFINITIONS[CharacterStyle.SPECIAL].races).map(([id, def]) => ({
      id,
      ...def,
    })) as LoraPreset[],
  },
};

export type CharacterConfig = typeof CHARACTER_CONFIG;
