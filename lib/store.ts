import { create } from 'zustand';
import {
  CharacterDraft,
  CharacterIdentity,
  CharacterBody,
  CharacterAppearance,
  CharacterPersonality,
  PersonalityTraits,
} from './types';

interface CharacterBuilderStore {
  draft: CharacterDraft;
  setCurrentStep: (step: number) => void;
  setIdentity: (identity: Partial<CharacterIdentity>) => void;
  setBody: (body: Partial<CharacterBody>) => void;
  setAppearance: (appearance: Partial<CharacterAppearance>) => void;
  setPersonality: (personality: Partial<CharacterPersonality>) => void;
  setPersonalityTraits: (traits: Partial<PersonalityTraits>) => void;
  resetDraft: () => void;
  loadDraft: (draft: CharacterDraft) => void;
  getDraft: () => CharacterDraft;
}

const initialDraft: CharacterDraft = {
  currentStep: 1,
  identity: {
    ageGroup: null,
    ethnicity: null,
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
};

export const useCharacterBuilder = create<CharacterBuilderStore>((set, get) => ({
  draft: initialDraft,

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

  resetDraft: () => set({ draft: initialDraft }),

  loadDraft: (draft: CharacterDraft) => set({ draft }),

  getDraft: () => get().draft,
}));
