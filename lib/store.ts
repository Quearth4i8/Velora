import { create } from 'zustand';
import {
  CharacterDraft,
  CharacterIdentity,
  CharacterBody,
  CharacterAppearance,
  CharacterPersonality,
  PersonalityTraits,
  CharacterGeneration,
  CharacterStyle,
  AIModel,
} from './types';

interface CharacterBuilderStore {
  draft: CharacterDraft;
  setCurrentStep: (step: number) => void;
  setName: (name: string) => void;
  setIdentity: (identity: Partial<CharacterIdentity>) => void;
  setBody: (body: Partial<CharacterBody>) => void;
  setAppearance: (appearance: Partial<CharacterAppearance>) => void;
  setPersonality: (personality: Partial<CharacterPersonality>) => void;
  setPersonalityTraits: (traits: Partial<PersonalityTraits>) => void;
  setGeneration: (generation: Partial<CharacterGeneration>) => void;
  updateCharacter: (updates: Partial<CharacterDraft>) => void;
  resetDraft: () => void;
  loadDraft: (draft: CharacterDraft) => void;
  getDraft: () => CharacterDraft;
}

const initialDraft: CharacterDraft = {
  currentStep: 0,
  name: '',
  identity: {
    age: null,
    ethnicity: null,
    skinTone: undefined,
  },
  body: {
    height: null,
    physique: null,
    chestSize: null,
    buttSize: null,
  },
  appearance: {
    hairStyle: null,
    hairColor: null,
    eyeColor: null,
    eyeType: null,
    clothing: null,
    environment: null,
  },
  personality: {
    archetype: null,
    isCustom: false,
    traits: {
      submissiveDominant: 50,
      insecureConfident: 50,
      coldPassionate: 50,
      reservedOutgoing: 50,
      seriousPlayful: 50,
    },
  },
  generation: {
    style: null as CharacterStyle | null,
    model: null as AIModel | null,
    generationStatus: 'pending',
  },
};

export const useCharacterBuilder = create<CharacterBuilderStore>((set, get) => ({
  draft: initialDraft,

  setName: (name: string) =>
    set((state) => ({
      draft: { ...state.draft, name },
    })),

  setCurrentStep: (step: number) =>
    set((state) => ({
      draft: { ...state.draft, currentStep: step },
    })),

  setIdentity: (identity: Partial<CharacterIdentity>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        identity: { ...state.draft.identity, ...identity },
      },
    })),

  setBody: (body: Partial<CharacterBody>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        body: { ...state.draft.body, ...body },
      },
    })),

  setAppearance: (appearance: Partial<CharacterAppearance>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        appearance: { ...state.draft.appearance, ...appearance },
      },
    })),

  setPersonality: (personality: Partial<CharacterPersonality>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        personality: { ...state.draft.personality, ...personality },
      },
    })),

  setPersonalityTraits: (traits: Partial<PersonalityTraits>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        personality: {
          ...state.draft.personality,
          traits: { ...state.draft.personality.traits, ...traits },
        },
      },
    })),

  setGeneration: (generation: Partial<CharacterGeneration>) =>
    set((state) => ({
      draft: {
        ...state.draft,
        generation: { ...state.draft.generation, ...generation },
      },
    })),

  updateCharacter: (updates: Partial<CharacterDraft>) =>
    set((state) => ({
      draft: { ...state.draft, ...updates },
    })),

  resetDraft: () => set({ draft: initialDraft }),

  loadDraft: (draft: CharacterDraft) => set({ draft }),

  getDraft: () => get().draft,
}));
