export enum AgeGroup {
  EIGHTEEN_PLUS = '18+',
  TWENTIES = '20s',
  THIRTIES = '30s',
  FORTIES = '40s',
  FIFTIES = '50s',
  CUSTOM = 'custom',
}

export enum Ethnicity {
  CAUCASIAN = 'caucasian',
  AFRICAN = 'african',
  ASIAN = 'asian',
  MIDDLE_EASTERN = 'middle_eastern',
  LATIN = 'latin',
  MIXED = 'mixed',
}

export enum Height {
  TINY = 'tiny',
  BELOW_AVERAGE = 'below_average',
  AVERAGE = 'average',
  TALL = 'tall',
  GIANT = 'giant',
}

export enum Physique {
  SLIM = 'slim',
  ATHLETIC = 'athletic',
  AVERAGE = 'average',
  CURVY = 'curvy',
  BBW = 'bbw',
}

export enum ChestSize {
  FLAT = 'flat',
  SMALL = 'small',
  AVERAGE = 'average',
  BIG = 'big',
  HUGE = 'huge',
}

export enum ButtSize {
  FLAT = 'flat',
  SMALL = 'small',
  AVERAGE = 'average',
  BIG = 'big',
  HUGE = 'huge',
}

export enum HairStyle {
  STRAIGHT = 'straight',
  BANGS = 'bangs',
  BRAIDS = 'braids',
  CURLY = 'curly',
  BUN = 'bun',
  PONYTAIL = 'ponytail',
  BOB = 'bob',
}

export enum HairColor {
  BLACK = '#000000',
  BROWN = '#8B4513',
  BLONDE = '#FFD700',
  RED = '#DC143C',
  PURPLE = '#800080',
  PINK = '#FF69B4',
  BLUE = '#0000FF',
  GREEN = '#008000',
  SILVER = '#C0C0C0',
}

export enum EyeColor {
  BROWN = 'brown',
  BLUE = 'blue',
  GREEN = 'green',
  HAZEL = 'hazel',
  GRAY = 'gray',
  AMBER = 'amber',
  VIOLET = 'violet',
}

export enum EyeType {
  NORMAL = 'normal',
  SIREN = 'siren',
  FOX = 'fox',
  CAT = 'cat',
  DOE = 'doe',
  WOLF = 'wolf',
  EAGLE = 'eagle',
  DRAGON = 'dragon',
}

export enum ClothingStyle {
  CASUAL = 'casual',
  FORMAL = 'formal',
  SPORTY = 'sporty',
  ELEGANT = 'elegant',
  CUTE = 'cute',
  EDGY = 'edgy',
  TRADITIONAL = 'traditional',
  FANTASY = 'fantasy',
}

export interface PersonalityTraits {
  submissiveDominant: number;
  insecureConfident: number;
  coldPassionate: number;
  reservedOutgoing: number;
  seriousPlayful: number;
}

export interface CharacterIdentity {
  age: number | null;
  ethnicity: Ethnicity | null;
  skinTone?: string;
}

export interface CharacterBody {
  height: Height | null;
  physique: Physique | null;
  chestSize: ChestSize | null;
  buttSize: ButtSize | null;
}

export interface CharacterAppearance {
  hairStyle: HairStyle | null;
  hairColor: HairColor | null;
  eyeColor: EyeColor | null;
  eyeType: EyeType | null;
  clothing: ClothingStyle | null;
}

export interface CharacterPersonality {
  archetype: string | null;
  isCustom: boolean;
  traits: PersonalityTraits;
}

export interface CharacterDraft {
  id?: string;
  name?: string;
  currentStep: number;
  identity: CharacterIdentity;
  body: CharacterBody;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  generation: CharacterGeneration;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CharacterStyle {
  ANIME = 'anime',
  REALISTIC = 'realistic',
  ARTISTIC = 'artistic',
}

export enum AIModel {
  CYBERREALISTIC = 'cyberrealisticPony_v140.safetensors',
  ONEOBSESSION = 'oneObsession_v18.safetensors',
  PERFECTDELIBERATE = 'perfectdeliberate_v30.safetensors',
}

export interface CharacterImage {
  id: string;
  characterId: string;
  imageUrl: string;
  fileName: string;
  fileSize?: number;
  isPrimary: boolean;
  generationPrompt?: string;
  generationModel?: string;
  generationStyle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterGeneration {
  style: CharacterStyle | null;
  model: AIModel | null;
  prompt?: string;
  negativePrompt?: string;
  generatedImage?: string;
  generationStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  images?: CharacterImage[]; // Gallery of images
}

export interface ChatMessage {
  id: string;
  characterId: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
}

export interface Character {
  id: string;
  draft: CharacterDraft;
  generation: CharacterGeneration;
  createdAt: Date;
  updatedAt: Date;
}
