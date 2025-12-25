import { AgeGroup, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, HairColor, EyeColor, CharacterStyle } from '@/lib/types';

type LoraPreset = {
  id: string;
  label: string;
  description?: string;
  mainTag?: string;
  specialPrompt?: string;
  loraNames?: string[];
  loraName?: string;
  loraWeight?: number | null;
  imageSrc?: string;
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
    [CharacterStyle.ANIME]: [
      {
        id: 'human',
        label: 'Human',
        description: 'Default human appearance',
        loraName: undefined,
        loraWeight: null,
      },
      {
        id: 'angel',
        label: 'Angel',
        mainTag: 'angel',
        specialPrompt: 'long shiny white wings, barefoot, angel_wings',
        loraName: 'angel_wings.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'slime-girl',
        label: 'Slime Girl',
        mainTag: 'slime girl',
        specialPrompt: 'slime girl, slime (substance), fully transparent body, uniform translucent slime, consistent transparency throughout body, no opaque patches, entire body made of slime, homogeneous slime texture, (transparent body:1.3), (see-through:1.2), (translucent skin:1.2), blue slime covering entire body, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'slime_girl.safetensors',
        loraWeight: 1,
      },
      {
        id: 'lamia',
        label: 'Lamia',
        mainTag: 'lamia',
        specialPrompt: 'lamia, snake woman, anime fantasy girl, serpent tail, mythical creature, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'lamia.safetensors',
        loraWeight: 0.7,
      },
      {
        id: 'harpy',
        label: 'Harpy',
        mainTag: 'harpy',
        specialPrompt: 'Harpy, wings, talons, monster girl, winged arms, feathered wings, bird legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'harpy.safetensors',
        loraWeight: 0.7,
      },
      {
        id: 'centaur',
        label: 'Centaur',
        mainTag: 'centaur',
        specialPrompt: 'deer taur, monster girl, deer body, detailed fur, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'centaur.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'goblin-girl',
        label: 'Goblin Girl',
        mainTag: 'goblin girl',
        specialPrompt:
          'female goblin, colored skin, green skin, freckles, long pointed ears, wide hips, large breasts, sharp teeth, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'goblina.safetensors',
        loraWeight: 0.9,
      },
      {
        id: 'elf',
        label: 'Elf',
        mainTag: 'elf',
        specialPrompt: 'long pointed ears, longer ears, slender figure, long legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: undefined,
        loraWeight: null,
      },
      {
        id: 'fairy',
        label: 'Fairy',
        mainTag: 'fairy',
        specialPrompt: 'butterfly wings, blue wings, fairy, fairymge, pointy ears, fairy wings, tiny fairy, petite fairy, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'fairy.safetensors',
        loraWeight: 1,
      },
      {
        id: 'demon',
        label: 'Demon',
        mainTag: 'demon',
        specialPrompt:
          'demonmge, demon girl, monster girl, pointy ears, demon tail, demon wings, demon horns, colored skin, blue skin, colored sclera, black sclera, spade-tipped tail, prehensile tail, claws, dark purple wings, dark purple tail, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'demon.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'succubus',
        label: 'Succubus',
        mainTag: 'succubus',
        specialPrompt:
          'succubus, demon girl, monster girl, pointy ears, demon tail, demon horns, colored skin, blue skin, colored sclera, black sclera, spade-tipped tail, prehensile tail, claws, dark purple tail, no wings, small horns, womb tattoo, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraNames: ['demon.safetensors', 'womb_tattoo.safetensors'],
        loraName: undefined,
        loraWeight: 0.8,
      },
    ] as LoraPreset[],
    [CharacterStyle.ARTISTIC]: [
      {
        id: 'lamia',
        label: 'Lamia',
        mainTag: 'lamia',
        specialPrompt: 'lamia, snake woman, anime fantasy girl, serpent tail, mythical creature, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'lamia.safetensors',
        loraWeight: 0.7,
      },
      {
        id: 'harpy',
        label: 'Harpy',
        mainTag: 'harpy',
        specialPrompt: 'Harpy, wings, talons, monster girl, winged arms, feathered wings, bird legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'harpy.safetensors',
        loraWeight: 0.7,
      },
      {
        id: 'centaur',
        label: 'Centaur',
        mainTag: 'centaur',
        specialPrompt: 'deer taur, monster girl, deer body, detailed fur, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'centaur.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'goblin-girl',
        label: 'Goblin Girl',
        mainTag: 'goblin girl',
        specialPrompt:
          'female goblin, colored skin, green skin, freckles, long pointed ears, wide hips, large breasts, sharp teeth, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'goblina.safetensors',
        loraWeight: 0.9,
      },
      {
        id: 'elf',
        label: 'Elf',
        mainTag: 'elf',
        specialPrompt: 'long pointed ears, longer ears, slender figure, long legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: undefined,
        loraWeight: null,
      },
      {
        id: 'fairy',
        label: 'Fairy',
        mainTag: 'fairy',
        specialPrompt: 'butterfly wings, blue wings, fairy, fairymge, pointy ears, fairy wings, tiny fairy, petite fairy, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'fairy.safetensors',
        loraWeight: 1,
      },
      {
        id: 'demon',
        label: 'Demon',
        mainTag: 'demon',
        specialPrompt:
          'demonmge, demon girl, monster girl, pointy ears, demon tail, demon wings, demon horns, colored skin, blue skin, colored sclera, black sclera, spade-tipped tail, prehensile tail, claws, dark purple wings, dark purple tail, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'demon.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'succubus',
        label: 'Succubus',
        mainTag: 'succubus',
        specialPrompt:
          'succubus, demon girl, monster girl, pointy ears, demon tail, demon horns, colored skin, blue skin, colored sclera, black sclera, spade-tipped tail, prehensile tail, claws, dark purple tail, no wings, small horns, womb tattoo, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraNames: ['demon.safetensors', 'womb_tattoo.safetensors'],
        loraName: undefined,
        loraWeight: 0.8,
      },
    ] as LoraPreset[],
    [CharacterStyle.REALISTIC]: [
      {
        id: 'human',
        label: 'Human',
        description: 'Default human appearance',
        loraName: undefined,
        loraWeight: null,
      },
      {
        id: 'goth',
        label: 'Goth',
        mainTag: 'goth',
        specialPrompt: 'seductive goth girl, pale porcelain skin, intense smoky eyes with sharp eyeliner, long dark lashes, deep crimson lips, beautiful intricate detailed eyes, perfectly symmetrical piercing gaze, crystal-clear pupils reflecting dim light, mysterious and alluring expression, raven black hair cascading over shoulders, dark Victorian lace choker, subtle gothic makeup accentuating flawless features, captivating and enigmatic beauty',
        loraName: 'goth.safetensors',
        loraWeight: 0.75,
      },
      {
        id: 'vampire',
        label: 'Vampire',
        mainTag: 'vampire',
        specialPrompt:
          'Vampire Fangs, cute freckled vampire woman, Extremely high-resolution details, photographic, realism pushed to extreme, fine texture, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'vampire.safetensors',
        loraWeight: 0.8,
      },
      {
        id: 'cyberpunk-girl',
        label: 'Cyberpunk Girl',
        mainTag: 'cyberpunk girl',
        specialPrompt:
          'cyberpunk girls style, neon lights, high detail, vibrant colors, cybernetic fashion, gritty sci-fi aesthetic, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'cyber.safetensors',
        loraWeight: 0.6,
      },
    ] as LoraPreset[],
  },
};

export type CharacterConfig = typeof CHARACTER_CONFIG;
