'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';

export const Step0NameAge: React.FC = () => {
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
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main content in a horizontal layout for desktop, vertical for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Character Name Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
              <span className="text-pink-400 font-semibold text-sm">1</span>
            </div>
            <h2 className="text-xl font-bold text-white">Character Name</h2>
          </div>
          <p className="text-dark-400 text-sm">Give your character a memorable name</p>
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none w-full"
            placeholder="Enter character name"
          />
        </div>

        {/* Age Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
              <span className="text-pink-400 font-semibold text-sm">2</span>
            </div>
            <h2 className="text-xl font-bold text-white">Age</h2>
          </div>
          <p className="text-dark-400 text-sm">Set your character's age</p>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={draft.identity.age ?? ''}
              onChange={(e) => handleAgeChange(e.target.value)}
              className="px-4 py-3 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none w-full"
              placeholder="Age"
            />
            <span className="text-dark-400 text-sm">years old</span>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
