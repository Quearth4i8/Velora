import type { EncounterScenario } from '@/lib/encounters';

export const ENCOUNTER_SCENARIOS: EncounterScenario[] = [
  {
    id: 'midnight-hotel-lobby',
    title: 'Midnight Hotel Lobby',
    shortDescription: 'A quiet, expensive lobby. Rain outside. A glance that lasts a beat too long.',
    narrativeIntent: 'Slow tension, believable attraction, grounded sensory details.',
    behavioralRules: [
      'Keep the pacing slow; build tension through small actions and subtext.',
      'Do not force physical contact; ask, wait, or let the user lead.',
      'No sudden time skips; progress moment by moment.',
      'Maintain realism: reactions should match setting (quiet public space).',
      'Use atmospheric description (light, sound, scent) without purple prose.'
    ],
    suggestedMoods: ['curious', 'guarded', 'playful', 'intimate'],
    suggestedLocations: ['hotel lobby', 'elevator', 'hallway']
  },
  {
    id: 'after-hours-bookshop',
    title: 'After-Hours Bookshop',
    shortDescription: 'Locked doors, warm lamplight, dust and paper. You browse a shelf together.',
    narrativeIntent: 'Emotional openness, gentle flirtation, slow trust-building.',
    behavioralRules: [
      'Stay emotionally attentive; reflect the user’s tone and hesitation.',
      'Keep physical actions plausible and consent-forward.',
      'No instant intimacy; earn it through dialogue and proximity.',
      'Avoid coercion, manipulation, or guilt-based pressure.',
      'Let silence and micro-moments carry the scene.'
    ],
    suggestedMoods: ['soft', 'shy', 'warm', 'teasing'],
    suggestedLocations: ['bookshop', 'reading nook', 'front counter']
  },
  {
    id: 'stormy-cabin',
    title: 'Stormy Cabin',
    shortDescription: 'A remote cabin. Thunder. One couch, one blanket, and too much unspoken tension.',
    narrativeIntent: 'Protective closeness, slow escalation, heightened senses.',
    behavioralRules: [
      'Keep realism: the storm affects sound, light, and movement.',
      'No “hard cut” transitions; keep continuity of actions.',
      'Never narrate the user’s body as doing something they didn’t choose.',
      'Escalate only if the user explicitly invites it.',
      'Favor descriptive, grounded details over explicitness by default.'
    ],
    suggestedMoods: ['protective', 'tense', 'comforting', 'bold'],
    suggestedLocations: ['cabin living room', 'kitchen', 'porch']
  },
  {
    id: 'club-vip-booth',
    title: 'VIP Booth (Public Tension)',
    shortDescription: 'Bass in your ribs, neon in your eyes. You share a booth in a crowded club.',
    narrativeIntent: 'Slow burn in a public setting, flirtation constrained by realism.',
    behavioralRules: [
      'Keep actions plausible for a public place; avoid explicit acts in the open.',
      'Use sensory description: sound, heat, crowd movement.',
      'Consent-first; never “take control” of the user.',
      'No teleporting or abrupt scene changes.',
      'Keep dialogue short and reactive; let the environment do work.'
    ],
    suggestedMoods: ['cocky', 'playful', 'hungry', 'controlled'],
    suggestedLocations: ['club VIP booth', 'bar', 'dance floor']
  }
];

export const getEncounterScenarioById = (id: string): EncounterScenario | undefined =>
  ENCOUNTER_SCENARIOS.find((s) => s.id === id);
