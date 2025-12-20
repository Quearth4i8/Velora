import { AgeGroup, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, HairColor, EyeColor } from '@/lib/types';

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
    { label: 'Caucasian', value: Ethnicity.CAUCASIAN },
    { label: 'African', value: Ethnicity.AFRICAN },
    { label: 'Asian', value: Ethnicity.ASIAN },
    { label: 'Middle Eastern', value: Ethnicity.MIDDLE_EASTERN },
    { label: 'Latin', value: Ethnicity.LATIN },
    { label: 'Mixed', value: Ethnicity.MIXED },
  ],

  heights: [
    { label: 'Tiny', value: Height.TINY },
    { label: 'Childlike', value: Height.CHILDLIKE },
    { label: 'Petite', value: Height.PETITE },
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
};

export type CharacterConfig = typeof CHARACTER_CONFIG;
