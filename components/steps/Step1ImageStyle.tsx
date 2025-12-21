'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';

const styleOptions = [
  { id: CharacterStyle.ANIME, label: 'Anime', description: 'Stylized anime aesthetic' },
  { id: CharacterStyle.REALISTIC, label: 'Realistic', description: 'Photorealistic appearance' },
  { id: CharacterStyle.ARTISTIC, label: 'Artistic', description: 'Artistic and creative style' },
];

export const Step1ImageStyle: React.FC = () => {
  const { draft, setGeneration } = useCharacterBuilder();

  const handleStyleSelect = (style: CharacterStyle) => {
    const model = automatic1111API.getModelForStyle(style);
    setGeneration({ style, model });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Image Style</h2>
        <p className="text-dark-400 mb-6">Choose the artistic style for your character</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {styleOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleStyleSelect(option.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                draft.generation?.style === option.id
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                  : 'border-dark-700 bg-dark-950/40 hover:border-pink-500/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="font-semibold text-white mb-1">{option.label}</h3>
              <p className="text-sm text-dark-400">{option.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
