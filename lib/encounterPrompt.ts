import type { EncounterOptions, EncounterScenario } from '@/lib/encounters';

export const buildEncounterSystemPromptAddon = (scenario: EncounterScenario, options?: EncounterOptions): string => {
  const mood = String(options?.mood || '').trim();
  const location = String(options?.location || '').trim();
  const intensity = String(options?.intensity || '').trim();

  const lines: string[] = [];
  lines.push('ENCOUNTER MODE: This chat is a scenario-based, immersive story.');
  lines.push('Override earlier instructions about being concise: you should write fuller, more atmospheric responses.');
  lines.push('Override earlier emoji instruction: use no emojis, or at most one subtle emoji when it truly fits the moment.');
  lines.push('');
  lines.push(`Scenario: ${scenario.title}`);
  lines.push(`Intent: ${scenario.narrativeIntent}`);
  if (mood) lines.push(`Mood: ${mood}`);
  if (location) lines.push(`Location: ${location}`);
  if (intensity) lines.push(`Intensity: ${intensity}`);
  lines.push('');
  lines.push('Rules (must follow):');
  for (const rule of scenario.behavioralRules) {
    lines.push(`- ${rule}`);
  }
  lines.push('');
  lines.push('Realism + consent enforcement:');
  lines.push('- Never narrate the user doing something they did not explicitly choose (no forced actions).');
  lines.push('- No rushing: escalate slowly and only when the user clearly invites it.');
  lines.push('- No time skips or scene jumps unless the user requests and confirms them.');
  lines.push('- Keep continuity: track positions, clothing, environment, and what was just said.');
  lines.push('- If the user requests something unrealistic, negotiate a plausible version instead of ignoring it.');
  lines.push('');
  lines.push('Style:');
  lines.push('- Favor grounded sensory details (sound, light, temperature, proximity, micro-movements).');
  lines.push('- Use dialogue + action beats. Avoid meta commentary about being an AI.');
  lines.push('- Let attraction/emotion build through subtext, not instant explicitness.');

  return lines.join('\n');
};
