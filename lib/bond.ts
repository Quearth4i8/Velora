import { BOND_LEVELS, type BondLevel } from '@/config/bond-levels';

export interface BondState {
  points: number;
  level: BondLevel;
}

export const clampBondPoints = (points: number): number => {
  const n = Number(points);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1000, Math.round(n)));
};

export const getBondLevelFromPoints = (points: number): BondLevel => {
  const p = clampBondPoints(points);
  let best = BOND_LEVELS[0];
  for (const level of BOND_LEVELS) {
    if (p >= level.minPoints) best = level;
  }
  return best;
};

export const getBondState = (points: number): BondState => ({
  points: clampBondPoints(points),
  level: getBondLevelFromPoints(points),
});

export const buildBondSystemPromptAddon = (bond: BondState | null): string => {
  if (!bond) return '';
  return [
    'BOND CONTEXT:',
    `Bond level: ${bond.level.name}.`,
    `Behavior baseline: ${bond.level.behavior}`,
  ].join('\n');
};

export const computeBondPointsDeltaFromUserText = (text: string): number => {
  const t = String(text || '').toLowerCase();
  const hasAny = (list: string[]) => list.some((w) => t.includes(w));

  const affection = [
    'thank you',
    'thanks',
    'i appreciate',
    'i trust you',
    'i feel safe',
    'i love you',
    'miss you',
    'proud of you',
    'good girl',
    'hug',
    'kiss',
  ];

  const hostility = [
    'shut up',
    'stupid',
    'idiot',
    'hate you',
    'ugly',
    'bitch',
    'whore',
    'slut',
    'die',
    'kill yourself',
  ];

  const betrayal = [
    'liar',
    'you lied',
    'you tricked me',
    'you used me',
    "i don't trust you",
    'dont trust you',
  ];

  let delta = 1;
  if (hasAny(affection)) delta += 3;
  if (hasAny(hostility)) delta -= 6;
  if (hasAny(betrayal)) delta -= 10;

  return delta;
};

export const computeBondDecayFromInactivityDays = (days: number): number => {
  const d = Math.max(0, Math.floor(Number(days)));
  if (d < 14) return 0;
  const weeks = Math.floor((d - 14) / 7);
  return weeks * 5;
};
