export const formatEnumValue = (value: string | null | undefined): string => {
  if (!value) return 'Not selected';
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/-/g, ' ');
};

export const formatTraitLabel = (trait: string): string => {
  const labels: Record<string, string> = {
    submissiveDominant: 'Submissive ↔ Dominant',
    insecureConfident: 'Insecure ↔ Confident',
    coldPassionate: 'Cold ↔ Passionate',
    reservedOutgoing: 'Reserved ↔ Outgoing',
    seriousPlayful: 'Serious ↔ Playful',
  };
  return labels[trait] || trait;
};

export const formatTraitValue = (value: number): string => {
  if (value < 25) return 'Very Low';
  if (value < 50) return 'Low';
  if (value < 75) return 'High';
  return 'Very High';
};

export const formatArchetypeName = (archetype: string | null): string => {
  if (!archetype) return 'Not selected';
  return archetype
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
