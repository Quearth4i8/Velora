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
    { label: 'Caucasian', value: Ethnicity.CAUCASIAN, image: '/images/ethnicity-caucasian.jpg' },
    { label: 'African', value: Ethnicity.AFRICAN, image: '/images/ethnicity-african.jpg' },
    { label: 'Asian', value: Ethnicity.ASIAN, image: '/images/ethnicity-asian.jpg' },
    { label: 'Middle Eastern', value: Ethnicity.MIDDLE_EASTERN, image: '/images/ethnicity-middle-eastern.jpg' },
    { label: 'Latin', value: Ethnicity.LATIN, image: '/images/ethnicity-latin.jpg' },
    { label: 'Mixed', value: Ethnicity.MIXED, image: '/images/ethnicity-mixed.jpg' },
  ],

  heights: [
    { label: 'Tiny', value: Height.TINY },
    { label: 'Below Average', value: Height.BELOW_AVERAGE },
    { label: 'Average', value: Height.AVERAGE },
    { label: 'Tall', value: Height.TALL },
    { label: 'Giant', value: Height.GIANT },
  ],

  physiques: [
    { label: 'Slim', value: Physique.SLIM, image: '/images/physique-slim.jpg' },
    { label: 'Athletic', value: Physique.ATHLETIC, image: '/images/physique-athletic.jpg' },
    { label: 'Average', value: Physique.AVERAGE, image: '/images/physique-average.jpg' },
    { label: 'Curvy', value: Physique.CURVY, image: '/images/physique-curvy.jpg' },
    { label: 'BBW', value: Physique.BBW, image: '/images/physique-bbw.jpg' },
  ],

  chestSizes: [
    { label: 'Flat', value: ChestSize.FLAT, image: '/images/chest-flat.jpg' },
    { label: 'Small', value: ChestSize.SMALL, image: '/images/chest-small.jpg' },
    { label: 'Average', value: ChestSize.AVERAGE, image: '/images/chest-average.jpg' },
    { label: 'Big', value: ChestSize.BIG, image: '/images/chest-big.jpg' },
    { label: 'Huge', value: ChestSize.HUGE, image: '/images/chest-huge.jpg' },
  ],

  buttSizes: [
    { label: 'Flat', value: ButtSize.FLAT, image: '/images/butt-flat.jpg' },
    { label: 'Small', value: ButtSize.SMALL, image: '/images/butt-small.jpg' },
    { label: 'Average', value: ButtSize.AVERAGE, image: '/images/butt-average.jpg' },
    { label: 'Big', value: ButtSize.BIG, image: '/images/butt-big.jpg' },
    { label: 'Huge', value: ButtSize.HUGE, image: '/images/butt-huge.jpg' },
  ],

  hairStyles: [
    { label: 'Straight', value: HairStyle.STRAIGHT, image: '/images/hair-straight.jpg' },
    { label: 'Bangs', value: HairStyle.BANGS, image: '/images/hair-bangs.jpg' },
    { label: 'Braids', value: HairStyle.BRAIDS, image: '/images/hair-braids.jpg' },
    { label: 'Curly', value: HairStyle.CURLY, image: '/images/hair-curly.jpg' },
    { label: 'Bun', value: HairStyle.BUN, image: '/images/hair-bun.jpg' },
    { label: 'Ponytail', value: HairStyle.PONYTAIL, image: '/images/hair-ponytail.jpg' },
    { label: 'Bob', value: HairStyle.BOB, image: '/images/hair-bob.jpg' },
  ],

  hairColors: [
    { label: 'Black', value: HairColor.BLACK },
    { label: 'Brown', value: HairColor.BROWN },
    { label: 'Blonde', value: HairColor.BLONDE },
    { label: 'Red', value: HairColor.RED },
    { label: 'Purple', value: HairColor.PURPLE },
    { label: 'Pink', value: HairColor.PINK },
    { label: 'Blue', value: HairColor.BLUE },
    { label: 'Green', value: HairColor.GREEN },
    { label: 'Silver', value: HairColor.SILVER },
  ],

  eyeColors: [
    { label: 'Brown', value: EyeColor.BROWN, image: '/images/eyes-brown.jpg' },
    { label: 'Blue', value: EyeColor.BLUE, image: '/images/eyes-blue.jpg' },
    { label: 'Green', value: EyeColor.GREEN, image: '/images/eyes-green.jpg' },
    { label: 'Hazel', value: EyeColor.HAZEL, image: '/images/eyes-hazel.jpg' },
    { label: 'Gray', value: EyeColor.GRAY, image: '/images/eyes-gray.jpg' },
    { label: 'Amber', value: EyeColor.AMBER, image: '/images/eyes-amber.jpg' },
    { label: 'Violet', value: EyeColor.VIOLET, image: '/images/eyes-violet.jpg' },
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
