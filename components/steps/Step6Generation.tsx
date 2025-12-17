'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle, AIModel } from '@/lib/types';
import { OptionPill } from '../ui/OptionPill';

const styleOptions = [
  { id: CharacterStyle.ANIME, label: 'Anime', description: 'Stylized anime aesthetic' },
  { id: CharacterStyle.REALISTIC, label: 'Realistic', description: 'Photorealistic appearance' },
  { id: CharacterStyle.ARTISTIC, label: 'Artistic', description: 'Artistic and creative style' },
];

const modelOptions = [
  { id: AIModel.CYBERREALISTIC, label: 'CyberRealistic', description: 'High-quality realistic model' },
  { id: AIModel.ONEOBSESSION, label: 'OneObsession', description: 'Detailed character model' },
  { id: AIModel.PERFECTDELIBERATE, label: 'PerfectDeliberate', description: 'Precise artistic model' },
];

export const Step6Generation: React.FC = () => {
  const { draft, setGeneration } = useCharacterBuilder();

  const handleStyleSelect = (style: CharacterStyle) => {
    setGeneration({ style });
  };

  const handleModelSelect = (model: AIModel) => {
    setGeneration({ model });
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
                  ? 'border-purple-500 bg-purple-500/10 shadow-glow'
                  : 'border-dark-600 bg-dark-800 hover:border-purple-400'
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

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Model</h2>
        <p className="text-dark-400 mb-6">Select the AI model for generation</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleModelSelect(option.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                draft.generation?.model === option.id
                  ? 'border-purple-500 bg-purple-500/10 shadow-glow'
                  : 'border-dark-600 bg-dark-800 hover:border-purple-400'
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
