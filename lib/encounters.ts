export type EncounterIntensity = 'low' | 'medium' | 'high';

export interface EncounterScenario {
  id: string;
  title: string;
  shortDescription: string;
  narrativeIntent: string;
  behavioralRules: string[];
  suggestedMoods?: string[];
  suggestedLocations?: string[];
}

export interface EncounterOptions {
  mood?: string;
  location?: string;
  intensity?: EncounterIntensity;
}

export interface EncounterSessionConfig {
  scenarioId: string;
  characterId: string;
  options?: EncounterOptions;
}
