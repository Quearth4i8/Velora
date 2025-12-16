'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';

export const Step1CoreIdentity: React.FC = () => {
  const { draft, setName, setIdentity } = useCharacterBuilder();

  const handleNameChange = (name: string) => {
    setName(name);
  };

  const handleAgeSelect = (age: number) => {
    setIdentity({ age: age });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Character Name</h2>
        <p className="text-dark-400 mb-6">Give your character a name</p>
        <input
          type="text"
          value={draft.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          className="px-4 py-3 bg-dark-700/50 text-dark-200 rounded-lg border border-dark-600/50 focus:border-purple-500/50 focus:outline-none w-full max-w-md"
          placeholder="Enter character name"
        />
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Age</h2>
        <p className="text-dark-400 mb-6">Enter character age (18-100)</p>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            min="18"
            max="100"
            value={draft.identity.age || ''}
            onChange={(e) => handleAgeSelect(parseInt(e.target.value) || 0)}
            className="px-4 py-3 bg-dark-700/50 text-dark-200 rounded-lg border border-dark-600/50 focus:border-purple-500/50 focus:outline-none w-32"
            placeholder="Age"
          />
          <span className="text-dark-400 text-sm">years old</span>
        </div>
      </div>
    </motion.div>
  );
};
