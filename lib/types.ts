export enum AgeGroup {
  EIGHTEEN_PLUS = '18+',
  TWENTIES = '20s',
  THIRTIES = '30s',
  FORTIES = '40s',
  FIFTIES = '50s',
  CUSTOM = 'custom',
}

export enum Ethnicity {
  EAST_ASIAN = 'east_asian',
  KOREAN = 'korean',
  JAPANESE = 'japanese',
  BRAZILIAN = 'brazilian',
  COLOMBIAN = 'colombian',
  LATIN_AMERICAN = 'latin_american',
  RUSSIAN = 'russian',
  UKRAINIAN = 'ukrainian',
  SCANDINAVIAN = 'scandinavian',
  ITALIAN = 'italian',
  LEBANESE = 'lebanese',
  MIXED_EXOTIC = 'mixed_exotic',
}

export enum Height {
  TINY = 'tiny',
  CHILDLIKE = 'childlike',
  PETITE = 'petite',
  SMALL = 'small',
  AVERAGE = 'average',
  TALL = 'tall',
}

export enum Physique {
  CHILDLIKE = 'childlike',
  PETITE = 'petite',
  SLIM = 'slim',
  ATHLETIC = 'athletic',
  THICC = 'thicc',
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
  LONG = 'long',
  BUN = 'bun',
  PONYTAIL = 'ponytail',
  BOB = 'bob',
}

export enum HairColor {
  BLACK = '#000000',
  DARK_BROWN = '#2C1B0F',
  BROWN = '#8B4513',
  LIGHT_BROWN = '#C68642',
  BLONDE = '#FFD700',
  PLATINUM_BLONDE = '#F8F6E7',
  WHITE = '#FFFFFF',
  RED = '#DC143C',
  MAROON = '#800000',
  AUBURN = '#A52A2A',
  ORANGE = '#FF8C00',
  PURPLE = '#800080',
  PINK = '#FF69B4',
  BLUE = '#0000FF',
  TEAL = '#008080',
  GREEN = '#008000',
  SILVER = '#C0C0C0',
  GRAY = '#808080',
  TURQUOISE = '#40E0D0',
  LAVENDER = '#E6E6FA',
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
  BIG_ROUND = 'big_round',
  TAREME = 'tareme',
  TSURIME = 'tsurime',
  HALF_LIDDED = 'half_lidded',
  SLEEPY = 'sleepy',
  SPARKLY = 'sparkly',
  NARROW = 'narrow',
  PIERCING = 'piercing',
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
  LINGERIE = 'lingerie',
  NAKED = 'naked',
  BIKINI = 'bikini',
  UNDERWEAR = 'underwear',
  REVEALING = 'revealing',
  BODYSUIT = 'bodysuit',
  CUSTOM = 'custom',
}

export enum Environment {
  BEDROOM = 'bedroom',
  LIVING_ROOM = 'living_room',
  KITCHEN = 'kitchen',
  GARDEN = 'garden',
  BEACH = 'beach',
  FOREST = 'forest',
  CITY_STREET = 'city_street',
  PARK = 'park',
  CAFE = 'cafe',
  LIBRARY = 'library',
  ROOFTOP = 'rooftop',
  BALCONY = 'balcony',
  MOUNTAIN = 'mountain',
  LAKE = 'lake',
  CLUB = 'club',
  RESTAURANT = 'restaurant',
  MALL = 'mall',
  OFFICE = 'office',
  GYM = 'gym',
  POOL = 'pool',
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
  customClothing?: string;
  environment: Environment | null;
}

export interface CharacterPersonality {
  archetype: string | null;
  isCustom: boolean;
  traits: PersonalityTraits;
  customSpecialty?: string; // For special characters to define their unique specialty
}

export type CharacterType = 'custom' | 'special';

export interface CharacterDraft {
  id?: string;
  userId?: string;
  name?: string;
  characterType?: CharacterType;
  stylePreset?: string;
  mainTag?: string;
  loraNames?: string[];
  loraName?: string;
  loraWeight?: number | null;
  specialPrompt?: string;
  specialNegativePrompt?: string;
  currentStep: number;
  identity: CharacterIdentity;
  body: CharacterBody;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  generation: CharacterGeneration;
  isGalleryOnly?: boolean; // Flag to exclude from chat
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CharacterStyle {
  ANIME = 'anime',
  REALISTIC = 'realistic',
  ARTISTIC = 'artistic',
  SPECIAL = 'special',
}

export enum AIModel {
  CYBERREALISTIC = 'cyberrealisticPony_v140.safetensors',
  ONEOBSESSION = 'oneObsession_v18.safetensors',
  PERFECTDELIBERATE = 'perfectdeliberate_v30.safetensors',
  PREFECT_ILLUSTRIOUS = 'prefectIllustriousXL_v3.safetensors',
}

export interface CharacterImage {
  id: string;
  characterId: string;
  userId?: string;
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
  seed?: number; // Seed used for initial character generation to maintain consistency
}

export interface ImageGenerationPlan {
  camera?: string[];
  poses?: string[];
  emotions?: string[];
  environments?: string[];
  clothing?: string[];
  negative?: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  characterId: string;
  content: string;
  sender: 'user' | 'character' | 'system';
  timestamp: Date;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  imagePlan?: ImageGenerationPlan;
}

export interface Conversation {
  id: string;
  characterId: string;
  userId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  draft: CharacterDraft;
  generation: CharacterGeneration;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}
