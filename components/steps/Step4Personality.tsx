'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { PersonalityArchetype, PersonalityTraits } from '@/lib/types';
import { Slider } from '@radix-ui/react-slider';

const archetypes: PersonalityArchetype[] = [
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

export const Step4Personality: React.FC = () => {
  const { draft, setPersonality, setPersonalityTraits } = useCharacterBuilder();
  const [isCustom, setIsCustom] = useState(draft.personality.isCustom);

  const handleArchetypeSelect = (archetype: PersonalityArchetype) => {
    setPersonality({
      archetype: archetype.id,
      isCustom: archetype.id === 'custom',
      traits: archetype.traits,
    });
    setIsCustom(archetype.id === 'custom');
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {archetypes.map((archetype) => (
            <motion.button
              key={archetype.id}
              onClick={() => handleArchetypeSelect(archetype)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-center ${
                draft.personality.archetype === archetype.id
                  ? 'border-purple-500 bg-purple-500/10 shadow-glow'
                  : 'border-dark-600 bg-dark-800 hover:border-purple-400'
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
          {traitLabels.map(({ key, left, right }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-dark-300">{left}</label>
                <span className="text-xs text-purple-400 font-semibold">
                  {draft.personality.traits[key]}
                </span>
                <label className="text-sm font-medium text-dark-300">{right}</label>
              </div>
              <Slider
                value={[draft.personality.traits[key]]}
                onValueChange={(value) => handleTraitChange(key, value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full h-2 bg-dark-700 rounded-full cursor-pointer"
              />
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
