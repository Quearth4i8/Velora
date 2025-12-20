export const PERSONALITY_ARCHETYPES = {
  JEALOUS_FLAME: 'jealous-flame',
  CUNNING_INNOCENT: 'cunning-innocent',
  POWER_PLAY: 'power-play',
  MYSTERIOUS_LOVER: 'mysterious-lover',
  CUSTOM: 'custom',
} as const;

export const AGE_GROUPS = {
  EIGHTEEN_PLUS: '18+',
  TWENTIES: '20s',
  THIRTIES: '30s',
  FORTIES: '40s',
  FIFTIES: '50s',
  CUSTOM: 'custom',
} as const;

export const ETHNICITIES = {
  CAUCASIAN: 'caucasian',
  AFRICAN: 'african',
  ASIAN: 'asian',
  MIDDLE_EASTERN: 'middle_eastern',
  LATIN: 'latin',
  MIXED: 'mixed',
} as const;

export const HEIGHTS = {
  TINY: 'tiny',
  CHILDLIKE: 'childlike',
  PETITE: 'petite',
  AVERAGE: 'average',
  TALL: 'tall',
} as const;

export const PHYSIQUES = {
  CHILDLIKE: 'childlike',
  PETITE: 'petite',
  SLIM: 'slim',
  ATHLETIC: 'athletic',
  THICC: 'thicc',
  CURVY: 'curvy',
  BBW: 'bbw',
} as const;

export const CHEST_SIZES = {
  FLAT: 'flat',
  SMALL: 'small',
  AVERAGE: 'average',
  BIG: 'big',
  HUGE: 'huge',
} as const;

export const BUTT_SIZES = {
  FLAT: 'flat',
  SMALL: 'small',
  AVERAGE: 'average',
  BIG: 'big',
  HUGE: 'huge',
} as const;

export const HAIR_STYLES = {
  STRAIGHT: 'straight',
  BANGS: 'bangs',
  BRAIDS: 'braids',
  CURLY: 'curly',
  BUN: 'bun',
  PONYTAIL: 'ponytail',
  BOB: 'bob',
} as const;

export const HAIR_COLORS = {
  BLACK: '#000000',
  DARK_BROWN: '#2C1B0F',
  BROWN: '#8B4513',
  LIGHT_BROWN: '#C68642',
  BLONDE: '#FFD700',
  PLATINUM_BLONDE: '#F8F6E7',
  WHITE: '#FFFFFF',
  RED: '#DC143C',
  AUBURN: '#A52A2A',
  ORANGE: '#FF8C00',
  PURPLE: '#800080',
  PINK: '#FF69B4',
  BLUE: '#0000FF',
  TEAL: '#008080',
  GREEN: '#008000',
  TURQUOISE: '#40E0D0',
  SILVER: '#C0C0C0',
  GRAY: '#808080',
  LAVENDER: '#E6E6FA',
} as const;

export const EYE_COLORS = {
  BROWN: 'brown',
  BLUE: 'blue',
  GREEN: 'green',
  HAZEL: 'hazel',
  GRAY: 'gray',
  AMBER: 'amber',
  VIOLET: 'violet',
} as const;

export const TRAIT_RANGES = {
  MIN: 0,
  MAX: 100,
  DEFAULT: 50,
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  VERY_SLOW: 0.8,
} as const;
