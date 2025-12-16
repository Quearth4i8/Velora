'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CharacterDraft } from '@/lib/types';
import { useCharacterBuilder } from '@/lib/store';

interface Step0CharacterNameProps {
  character: CharacterDraft;
  onNext: () => void;
}

export function Step0CharacterName({ character, onNext }: Step0CharacterNameProps) {
  const { updateCharacter } = useCharacterBuilder();
  const [name, setName] = useState(character.name || '');

  const handleNext = () => {
    if (name.trim()) {
      updateCharacter({ name: name.trim() });
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-dark-200 mb-4">
          Give Your Character a Name
        </h2>
        <p className="text-dark-400 text-lg">
          Every great character starts with a name. What would you like to call them?
        </p>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="character-name" className="block text-sm font-medium text-dark-300 mb-2">
              Character Name
            </label>
            <input
              id="character-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              placeholder="Enter character name..."
              className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600/50 rounded-xl text-dark-200 placeholder-dark-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              autoFocus
            />
            <p className="mt-2 text-sm text-dark-500">
              This name will be used throughout your chat experience and can be changed later.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 font-medium"
            >
              Continue to Identity
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-dark-500 text-sm">
          You can always change the name later in the character gallery.
        </p>
      </div>
    </motion.div>
  );
}
