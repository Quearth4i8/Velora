'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';

export const Step6PersistentDetails: React.FC = () => {
  const { draft, updateCharacter } = useCharacterBuilder();

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Persistent Details</h2>
        <p className="text-dark-400">
          Add visual details that should stay consistent across this character&apos;s images (tattoos, freckles, makeup,
          accessories, floating objects, etc.).
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-dark-200">Details (comma-separated)</label>
        <textarea
          value={draft.persistentPrompt || ''}
          onChange={(e) => updateCharacter({ persistentPrompt: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
          placeholder="Example: freckles, winged eyeliner, black choker, butterfly tattoo, floating glowing orbs"
        />
        <p className="text-xs text-dark-500">
          Tip: keep it short and specific. These will be appended to the character&apos;s base prompt.
        </p>
      </div>
    </motion.div>
  );
};
