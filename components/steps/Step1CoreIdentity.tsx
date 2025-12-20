'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';

export const Step1CoreIdentity: React.FC = () => {
  const { draft, setName, setIdentity } = useCharacterBuilder();

  const handleNameChange = (name: string) => {
    setName(name);
  };

  const handleAgeChange = (raw: string) => {
    if (!raw) {
      setIdentity({ age: null });
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setIdentity({ age: null });
      return;
    }

    setIdentity({ age: parsed });
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
          className="px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none w-full max-w-md"
          placeholder="Enter character name"
        />
      </div>

      <div className="border-t border-dark-700/60 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Age</h2>
        <p className="text-dark-400 mb-6">Enter character age</p>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={draft.identity.age ?? ''}
            onChange={(e) => handleAgeChange(e.target.value)}
            className="px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none w-32"
            placeholder="Age"
          />
          <span className="text-dark-400 text-sm">years old</span>
        </div>
      </div>
    </motion.div>
  );
};
