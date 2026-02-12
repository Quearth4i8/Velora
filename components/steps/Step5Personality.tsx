'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { PersonalityTraits } from '@/lib/types';

interface PersonalityArchetype {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTraits;
  tags?: string; // 4-word tags for Yordle personalities
}

const defaultArchetypes: PersonalityArchetype[] = [
  {
    id: 'jealous-flame',
    name: 'Jealous Flame',
    description: 'Passionate & possessive',
    traits: {
      submissiveDominant: 75,
      insecureConfident: 30,
      coldPassionate: 90,
      reservedOutgoing: 85,
      seriousPlayful: 40,
    },
  },
  {
    id: 'cunning-innocent',
    name: 'Cunning Innocent',
    description: 'Playful & mysterious',
    traits: {
      submissiveDominant: 40,
      insecureConfident: 70,
      coldPassionate: 60,
      reservedOutgoing: 75,
      seriousPlayful: 85,
    },
  },
  {
    id: 'power-play',
    name: 'Power Play',
    description: 'Dominant & commanding',
    traits: {
      submissiveDominant: 95,
      insecureConfident: 95,
      coldPassionate: 70,
      reservedOutgoing: 80,
      seriousPlayful: 50,
    },
  },
  {
    id: 'mysterious-lover',
    name: 'Mysterious Lover',
    description: 'Enigmatic & alluring',
    traits: {
      submissiveDominant: 50,
      insecureConfident: 65,
      coldPassionate: 75,
      reservedOutgoing: 35,
      seriousPlayful: 60,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own',
    traits: {
      submissiveDominant: 50,
      insecureConfident: 50,
      coldPassionate: 50,
      reservedOutgoing: 50,
      seriousPlayful: 50,
    },
  },
];

// Yordle-specific personality archetypes (4-word tags)
const yordleArchetypes: PersonalityArchetype[] = [
  {
    id: 'yordle-cheerful',
    name: 'Cheerful Prankster',
    description: 'Playful & benevolent',
    tags: 'cheerful playful prankster benevolent',
    traits: { submissiveDominant: 30, insecureConfident: 70, coldPassionate: 60, reservedOutgoing: 90, seriousPlayful: 95 },
  },
  {
    id: 'yordle-whimsical',
    name: 'Whimsical Dreamer',
    description: 'Dreamy & empathetic',
    tags: 'whimsical dreamy mischievous empathetic',
    traits: { submissiveDominant: 40, insecureConfident: 60, coldPassionate: 70, reservedOutgoing: 60, seriousPlayful: 80 },
  },
  {
    id: 'yordle-jovial',
    name: 'Jovial Optimist',
    description: 'Outgoing & friendly',
    tags: 'jovial optimistic outgoing friendly',
    traits: { submissiveDominant: 35, insecureConfident: 80, coldPassionate: 75, reservedOutgoing: 95, seriousPlayful: 90 },
  },
  {
    id: 'yordle-adventurous',
    name: 'Adventurous Spirit',
    description: 'Bold & thrill-seeking',
    tags: 'energetic adventurous thrill-seeking bold',
    traits: { submissiveDominant: 60, insecureConfident: 85, coldPassionate: 80, reservedOutgoing: 90, seriousPlayful: 85 },
  },
  {
    id: 'yordle-curious',
    name: 'Curious Wonder',
    description: 'Innocent & excited',
    tags: 'curious innocent wonder-filled excited',
    traits: { submissiveDominant: 25, insecureConfident: 70, coldPassionate: 85, reservedOutgoing: 80, seriousPlayful: 95 },
  },
  {
    id: 'yordle-brave',
    name: 'Brave Hero',
    description: 'Determined & dutiful',
    tags: 'brave determined heroic dutiful',
    traits: { submissiveDominant: 70, insecureConfident: 90, coldPassionate: 75, reservedOutgoing: 75, seriousPlayful: 40 },
  },
  {
    id: 'yordle-eccentric',
    name: 'Eccentric Inventor',
    description: 'Brilliant & absent-minded',
    tags: 'eccentric inventive brilliant absent-minded',
    traits: { submissiveDominant: 40, insecureConfident: 75, coldPassionate: 60, reservedOutgoing: 50, seriousPlayful: 70 },
  },
  {
    id: 'yordle-fiery',
    name: 'Fiery Rebel',
    description: 'Passionate & rebellious',
    tags: 'fiery passionate rebellious underdog',
    traits: { submissiveDominant: 75, insecureConfident: 70, coldPassionate: 90, reservedOutgoing: 80, seriousPlayful: 60 },
  },
  {
    id: 'yordle-chaotic',
    name: 'Chaotic Fun',
    description: 'Explosive & fun-loving',
    tags: 'chaotic explosive fun-loving destructive',
    traits: { submissiveDominant: 50, insecureConfident: 80, coldPassionate: 70, reservedOutgoing: 85, seriousPlayful: 95 },
  },
  {
    id: 'yordle-mischievous',
    name: 'Mischievous Sneak',
    description: 'Cunning & deceptive',
    tags: 'mischievous sneaky cunning deceptive',
    traits: { submissiveDominant: 55, insecureConfident: 65, coldPassionate: 50, reservedOutgoing: 70, seriousPlayful: 85 },
  },
  {
    id: 'yordle-gloomy',
    name: 'Gloomy Soul',
    description: 'Pessimistic & emo',
    tags: 'gloomy pessimistic depressive emo',
    traits: { submissiveDominant: 45, insecureConfident: 25, coldPassionate: 30, reservedOutgoing: 20, seriousPlayful: 20 },
  },
  {
    id: 'yordle-villainous',
    name: 'Comically Villainous',
    description: 'Evil & twisted',
    tags: 'villainous evil comically malevolent twisted',
    traits: { submissiveDominant: 85, insecureConfident: 70, coldPassionate: 40, reservedOutgoing: 60, seriousPlayful: 50 },
  },
  {
    id: 'yordle-dual',
    name: 'Dual Nature',
    description: 'Cheerful but dark',
    tags: 'dual cheerful ruthless hidden dark',
    traits: { submissiveDominant: 70, insecureConfident: 60, coldPassionate: 50, reservedOutgoing: 50, seriousPlayful: 50 },
  },
  {
    id: 'yordle-lonely',
    name: 'Lonely Tormented',
    description: 'Isolated & cursed',
    tags: 'lonely isolated tormented cursed',
    traits: { submissiveDominant: 40, insecureConfident: 20, coldPassionate: 25, reservedOutgoing: 15, seriousPlayful: 15 },
  },
  {
    id: 'yordle-protective',
    name: 'Protective Guardian',
    description: 'Loyal & fierce',
    tags: 'protective loyal fierce guardian',
    traits: { submissiveDominant: 65, insecureConfident: 85, coldPassionate: 70, reservedOutgoing: 60, seriousPlayful: 30 },
  },
  {
    id: 'yordle-mad',
    name: 'Mad Wild',
    description: 'Unpredictable & chaotic',
    tags: 'mad chaotic unpredictable wild',
    traits: { submissiveDominant: 60, insecureConfident: 75, coldPassionate: 65, reservedOutgoing: 70, seriousPlayful: 90 },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own',
    tags: '',
    traits: { submissiveDominant: 50, insecureConfident: 50, coldPassionate: 50, reservedOutgoing: 50, seriousPlayful: 50 },
  },
];

export const Step5Personality: React.FC = () => {
  const { draft, setPersonality, setPersonalityTraits } = useCharacterBuilder();
  const isCustom = draft.personality.archetype === 'custom';

  // Use Yordle archetypes if the character is a Yordle
  const isYordle = draft.mainTag?.toLowerCase() === 'yordle' || draft.stylePreset?.toLowerCase() === 'yordle';
  const archetypes = isYordle ? yordleArchetypes : defaultArchetypes;

  const handleArchetypeSelect = (archetype: PersonalityArchetype) => {
    setPersonality({
      archetype: archetype.id,
      isCustom: archetype.id === 'custom',
      traits: archetype.traits,
      customSpecialty: archetype.id === 'custom' ? draft.personality.customSpecialty : (archetype.tags || undefined),
    });

    if (archetype.id !== 'custom' && draft.personality.customSpecialty && !archetype.tags) {
      setPersonality({ customSpecialty: undefined });
    }
  };

  const handleTraitChange = (traitKey: keyof PersonalityTraits, value: number) => {
    setPersonalityTraits({ [traitKey]: value });
  };

  const traitLabels: { key: keyof PersonalityTraits; left: string; right: string }[] = [
    { key: 'submissiveDominant', left: 'Submissive', right: 'Dominant' },
    { key: 'insecureConfident', left: 'Insecure', right: 'Confident' },
    { key: 'coldPassionate', left: 'Cold', right: 'Passionate' },
    { key: 'reservedOutgoing', left: 'Reserved', right: 'Outgoing' },
    { key: 'seriousPlayful', left: 'Serious', right: 'Playful' },
  ];

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Personality Archetype</h2>
        <p className="text-dark-400 mb-6">Select an archetype or customize</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {archetypes.map((archetype) => (
            <motion.button
              key={archetype.id}
              onClick={() => handleArchetypeSelect(archetype)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-center ${
                draft.personality.archetype === archetype.id
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                  : 'border-dark-700 bg-dark-950/40 hover:border-pink-500/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <p className="font-semibold text-white text-sm">{archetype.name}</p>
              <p className="text-xs text-dark-400 mt-1">{archetype.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {isCustom && (
        <motion.div
          className="border-t border-dark-700 pt-8 space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Adjust Traits</h2>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-dark-200">Custom personality tags (comma-separated)</label>
            <textarea
              value={draft.personality.customSpecialty || ''}
              onChange={(e) => setPersonality({ customSpecialty: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
              placeholder="Example: flirty, teasing, jealous, confident, playful expression"
            />
          </div>

          {traitLabels.map(({ key, left, right }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-dark-300">{left}</label>
                <span className="text-xs text-pink-300 font-semibold">
                  {draft.personality.traits[key]}
                </span>
                <label className="text-sm font-medium text-dark-300">{right}</label>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={draft.personality.traits[key]}
                onChange={(e) => handleTraitChange(key, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${draft.personality.traits[key]}%, #374151 ${draft.personality.traits[key]}%, #374151 100%)`,
                }}
              />
            </div>
          ))}

          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 18px;
              height: 18px;
              background: #ec4899;
              border: 2px solid #fff;
              border-radius: 9999px;
              cursor: pointer;
              box-shadow: 0 0 12px rgba(236, 72, 153, 0.45);
            }

            .slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              background: #ec4899;
              border: 2px solid #fff;
              border-radius: 9999px;
              cursor: pointer;
              box-shadow: 0 0 12px rgba(236, 72, 153, 0.45);
            }

            .slider::-webkit-slider-thumb:hover {
              background: #f472b6;
              box-shadow: 0 0 16px rgba(236, 72, 153, 0.6);
            }

            .slider::-moz-range-thumb:hover {
              background: #f472b6;
              box-shadow: 0 0 16px rgba(236, 72, 153, 0.6);
            }
          `}</style>
        </motion.div>
      )}
    </motion.div>
  );
};
