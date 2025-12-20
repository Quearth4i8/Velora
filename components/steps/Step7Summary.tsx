'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { PrimaryCTAButton } from '../ui/PrimaryCTAButton';

export const Step7Summary: React.FC<{ onConfirm: () => void; isLoading?: boolean }> = ({
  onConfirm,
  isLoading = false,
}) => {
  const { draft } = useCharacterBuilder();

  const formatValue = (value: string | null | undefined) => {
    if (!value) return 'Not selected';
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
  };

  const getTraitLabel = (trait: string, value: number) => {
    const labels: Record<string, { low: string; high: string }> = {
      submissiveDominant: { low: 'Submissive', high: 'Dominant' },
      insecureConfident: { low: 'Insecure', high: 'Confident' },
      coldPassionate: { low: 'Cold', high: 'Passionate' },
      reservedOutgoing: { low: 'Reserved', high: 'Outgoing' },
      seriousPlayful: { low: 'Serious', high: 'Playful' },
    };

    const label = labels[trait];
    if (!label) return value.toString();

    const position = value <= 5 ? 'low' : 'high';
    return `${label[position]} (${value}/10)`;
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-white mb-2">Character Summary</h2>
      <p className="text-dark-400 mb-8">
        Review your character details before creating. Once confirmed, your character will be generated and saved.
      </p>

      <div className="space-y-6">
        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Name</p>
              <p className="text-white font-medium">{draft.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-dark-400">Age</p>
              <p className="text-white font-medium">{draft.identity.age ? `${draft.identity.age} years old` : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-dark-400">Ethnicity</p>
              <p className="text-white font-medium">{formatValue(draft.identity.ethnicity)}</p>
            </div>
            <div>
              <p className="text-dark-400">Skin Tone</p>
              <div className="flex items-center gap-2 mt-1">
                {draft.identity.skinTone && (
                  <div
                    className="w-6 h-6 rounded-full border border-dark-600"
                    style={{ backgroundColor: draft.identity.skinTone }}
                  />
                )}
                <p className="text-white font-medium">{draft.identity.skinTone ? 'Selected' : 'Not specified'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Physical Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Height</p>
              <p className="text-white font-medium">{formatValue(draft.body.height)}</p>
            </div>
            <div>
              <p className="text-dark-400">Physique</p>
              <p className="text-white font-medium">{formatValue(draft.body.physique)}</p>
            </div>
            <div>
              <p className="text-dark-400">Hair Style</p>
              <p className="text-white font-medium">{formatValue(draft.appearance.hairStyle)}</p>
            </div>
            <div>
              <p className="text-dark-400">Hair Color</p>
              <div className="flex items-center gap-2 mt-1">
                {draft.appearance.hairColor && (
                  <div
                    className="w-6 h-6 rounded-full border border-dark-600"
                    style={{ backgroundColor: draft.appearance.hairColor }}
                  />
                )}
                <p className="text-white font-medium">{draft.appearance.hairColor ? 'Selected' : 'Not specified'}</p>
              </div>
            </div>
            <div>
              <p className="text-dark-400">Eye Color</p>
              <p className="text-white font-medium">{formatValue(draft.appearance.eyeColor)}</p>
            </div>
            <div>
              <p className="text-dark-400">Chest Size</p>
              <p className="text-white font-medium">{formatValue(draft.body.chestSize)}</p>
            </div>
            <div>
              <p className="text-dark-400">Butt Size</p>
              <p className="text-white font-medium">{formatValue(draft.body.buttSize)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Personality Traits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Social Dynamics</p>
              <p className="text-purple-300 font-semibold">{getTraitLabel('submissiveDominant', draft.personality.traits.submissiveDominant)}</p>
            </div>
            <div>
              <p className="text-dark-400">Self-Confidence</p>
              <p className="text-purple-300 font-semibold">{getTraitLabel('insecureConfident', draft.personality.traits.insecureConfident)}</p>
            </div>
            <div>
              <p className="text-dark-400">Emotional Expression</p>
              <p className="text-purple-300 font-semibold">{getTraitLabel('coldPassionate', draft.personality.traits.coldPassionate)}</p>
            </div>
            <div>
              <p className="text-dark-400">Social Interaction</p>
              <p className="text-purple-300 font-semibold">{getTraitLabel('reservedOutgoing', draft.personality.traits.reservedOutgoing)}</p>
            </div>
            <div>
              <p className="text-dark-400">Demeanor</p>
              <p className="text-purple-300 font-semibold">{getTraitLabel('seriousPlayful', draft.personality.traits.seriousPlayful)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Generation Settings</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Art Style</p>
              <p className="text-white font-medium">{formatValue(draft.generation?.style)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mt-8 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-green-400 text-sm text-center">
            ✓ All character details reviewed. Ready to create your character!
          </p>
        </div>
        
        <PrimaryCTAButton
          label="Create Character"
          onClick={onConfirm}
          loading={isLoading}
          className="w-full max-w-md"
        />
        
        <p className="text-dark-400 text-xs mt-4 text-center">
          This will generate your character and save it to your collection
        </p>
      </motion.div>
    </motion.div>
  );
};
