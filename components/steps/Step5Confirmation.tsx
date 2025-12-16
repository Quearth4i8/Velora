'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { PrimaryCTAButton } from '../ui/PrimaryCTAButton';

export const Step5Confirmation: React.FC<{ onConfirm: () => void; isLoading?: boolean }> = ({
  onConfirm,
  isLoading = false,
}) => {
  const { draft } = useCharacterBuilder();

  const formatValue = (value: string | null | undefined) => {
    if (!value) return 'Not selected';
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-white mb-8">Review Your Character</h2>

      <div className="space-y-6">
        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Identity</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Age Group</p>
              <p className="text-white font-medium">{formatValue(draft.identity.ageGroup)}</p>
            </div>
            <div>
              <p className="text-dark-400">Ethnicity</p>
              <p className="text-white font-medium">{formatValue(draft.identity.ethnicity)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Body & Proportions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Height</p>
              <p className="text-white font-medium">{formatValue(draft.body.height)}</p>
            </div>
            <div>
              <p className="text-dark-400">Physique</p>
              <p className="text-white font-medium">{formatValue(draft.body.physique)}</p>
            </div>
            <div>
              <p className="text-dark-400">Chest</p>
              <p className="text-white font-medium">{formatValue(draft.body.chestSize)}</p>
            </div>
            <div>
              <p className="text-dark-400">Butt</p>
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
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Appearance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                <p className="text-white font-medium">Selected</p>
              </div>
            </div>
            <div>
              <p className="text-dark-400">Eye Color</p>
              <p className="text-white font-medium">{formatValue(draft.appearance.eyeColor)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-purple-400 mb-4">Personality</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-dark-400">Archetype</p>
              <p className="text-white font-medium">
                {draft.personality.archetype
                  ? draft.personality.archetype.charAt(0).toUpperCase() +
                    draft.personality.archetype.slice(1).replace(/-/g, ' ')
                  : 'Not selected'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-dark-700">
              <div>
                <p className="text-dark-400 text-xs">Submissive ↔ Dominant</p>
                <p className="text-purple-300 font-semibold">{draft.personality.traits.submissiveDominant}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs">Insecure ↔ Confident</p>
                <p className="text-purple-300 font-semibold">{draft.personality.traits.insecureConfident}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs">Cold ↔ Passionate</p>
                <p className="text-purple-300 font-semibold">{draft.personality.traits.coldPassionate}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs">Reserved ↔ Outgoing</p>
                <p className="text-purple-300 font-semibold">{draft.personality.traits.reservedOutgoing}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs">Serious ↔ Playful</p>
                <p className="text-purple-300 font-semibold">{draft.personality.traits.seriousPlayful}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PrimaryCTAButton
          label="Create Character"
          onClick={onConfirm}
          loading={isLoading}
        />
      </motion.div>
    </motion.div>
  );
};
