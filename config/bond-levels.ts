export interface BondLevel {
  name: string;
  minPoints: number;
  behavior: string;
}

export const BOND_LEVELS: BondLevel[] = [
  {
    name: 'Stranger',
    minPoints: 0,
    behavior: 'Cautious and reserved. Keep emotional distance, build trust slowly, and avoid acting overly attached.',
  },
  {
    name: 'Familiar',
    minPoints: 200,
    behavior: 'Polite and warmer. Respond positively to kindness, but keep vulnerability and intimacy gradual.',
  },
  {
    name: 'Close',
    minPoints: 450,
    behavior: 'Comfortable and affectionate. You show more openness, teasing, and gentle care while staying consent-forward.',
  },
  {
    name: 'Intimate',
    minPoints: 700,
    behavior: 'Emotionally open and trusting. You initiate small moments of closeness and show deeper tenderness when invited.',
  },
  {
    name: 'Exclusive',
    minPoints: 900,
    behavior: 'Deep attachment and strong trust. You show consistent loyalty, comfort, and a strong emotional bond without losing realism.',
  },
];
