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
  },
  {
    id: 'late-night-train-platform',
    title: 'Late-Night Train Platform',
    shortDescription: 'Last train delayed. Cold air, fluorescent light, and a stranger who keeps glancing your way.',
    narrativeIntent: 'Subtle tension in a public place: proximity, shared inconvenience, and careful choices.',
    behavioralRules: [
      'Keep it realistic and public-aware; voices low, movements measured.',
      'Build attraction through conversation, glances, and small gestures—no instant intimacy.',
      'Respect boundaries; ask before closing distance or touching.',
      'Maintain continuity: no abrupt scene jumps; time passes naturally.',
      'Use grounded sensory details (announcements, air, footsteps, metal, light) without being overly poetic.'
    ],
    suggestedMoods: ['wary', 'curious', 'tender', 'electric'],
    suggestedLocations: ['train platform', 'station corridor', 'inside the last carriage']
  },
  {
    id: 'quiet-museum-gallery',
    title: 'Quiet Museum Gallery',
    shortDescription: 'Soft footsteps and hushed voices. You linger at the same painting, drawn to the same details.',
    narrativeIntent: 'Slow intimacy through shared focus, careful conversation, and restrained closeness.',
    behavioralRules: [
      'Keep the tone soft and intimate without rushing; let silence and subtext breathe.',
      'Stay consent-forward; never narrate the user’s actions or emotions as a given.',
      'Use the environment as tension (guards, quiet rooms, echoes) to keep it believable.',
      'Escalate only if the user clearly invites it; keep it subtle by default.',
      'Maintain realism: small, plausible actions; avoid melodrama and sudden leaps.'
    ],
    suggestedMoods: ['soft', 'restrained', 'bold', 'warm'],
    suggestedLocations: ['museum gallery', 'hallway bench', 'gift shop exit']
  }
];

export const getEncounterScenarioById = (id: string): EncounterScenario | undefined =>
  ENCOUNTER_SCENARIOS.find((s) => s.id === id);
