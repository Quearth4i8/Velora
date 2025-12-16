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
  BELOW_AVERAGE: 'below_average',
  AVERAGE: 'average',
  TALL: 'tall',
  GIANT: 'giant',
} as const;

export const PHYSIQUES = {
  SLIM: 'slim',
  ATHLETIC: 'athletic',
  AVERAGE: 'average',
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
  BROWN: '#8B4513',
  BLONDE: '#FFD700',
  RED: '#DC143C',
  PURPLE: '#800080',
  PINK: '#FF69B4',
  BLUE: '#0000FF',
  GREEN: '#008000',
  SILVER: '#C0C0C0',
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
