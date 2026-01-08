'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { Ethnicity, Height } from '@/lib/types';
import { getSkinToneOptionsForRace } from '@/config/character-config';
import { ImageOptionCard } from '../ui/ImageOptionCard';
import { OptionPill } from '../ui/OptionPill';
import { Check } from 'lucide-react';

const ethnicityOptions = [
  { id: Ethnicity.EAST_ASIAN, label: 'East Asian', image: '/Ethnic Background/East Asian.jpg' },
  { id: Ethnicity.KOREAN, label: 'Korean', image: '/Ethnic Background/Korean.jpg' },
  { id: Ethnicity.JAPANESE, label: 'Japanese', image: '/Ethnic Background/Japanese.jpg' },
  { id: Ethnicity.BRAZILIAN, label: 'Brazilian', image: '/Ethnic Background/Brazilian.jpg' },
  { id: Ethnicity.COLOMBIAN, label: 'Colombian', image: '/Ethnic Background/Colombian.jpg' },
  { id: Ethnicity.LATIN_AMERICAN, label: 'Latin American', image: '/Ethnic Background/Latin American.jpg' },
  { id: Ethnicity.RUSSIAN, label: 'Russian', image: '/Ethnic Background/Russian.jpg' },
  { id: Ethnicity.UKRAINIAN, label: 'Ukrainian', image: '/Ethnic Background/Ukrainian.jpg' },
  { id: Ethnicity.SCANDINAVIAN, label: 'Scandinavian', image: '/Ethnic Background/Scandinavian.jpg' },
  { id: Ethnicity.ITALIAN, label: 'Italian', image: '/Ethnic Background/Italian.jpg' },
  { id: Ethnicity.LEBANESE, label: 'Lebanese', image: '/Ethnic Background/Lebanese.jpg' },
  { id: Ethnicity.MIXED_EXOTIC, label: 'Mixed / Exotic', image: '/Ethnic Background/Mixed-Exotic.jpg' },
];

const heightOptions = [Height.TINY, Height.CHILDLIKE, Height.PETITE, Height.SMALL, Height.AVERAGE, Height.TALL];

export const Step2BodyProportions: React.FC = () => {
  const { draft, setIdentity, setBody } = useCharacterBuilder();

  const skinToneOptions = React.useMemo(() => {
    return getSkinToneOptionsForRace(draft.stylePreset, draft.mainTag);
  }, [draft.mainTag, draft.stylePreset]);

  React.useEffect(() => {
    if (!draft.identity.skinTone) return;
    if (skinToneOptions.includes(draft.identity.skinTone)) return;
    setIdentity({ skinTone: skinToneOptions[0] });
  }, [draft.identity.skinTone, setIdentity, skinToneOptions]);

  const handleEthnicitySelect = (ethnicity: Ethnicity) => {
    setIdentity({ ethnicity });
  };

  const handleSkinToneSelect = (skinTone: string) => {
    setIdentity({ skinTone });
  };

  const handleHeightSelect = (height: Height) => {
    setBody({ height });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ethnic Background</h2>
        <p className="text-dark-400 mb-6">Choose a background</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ethnicityOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleEthnicitySelect(option.id as Ethnicity)}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ${
                draft.identity.ethnicity === option.id
                  ? 'ring-2 ring-pink-500/50 shadow-xl shadow-pink-500/20'
                  : 'shadow-lg hover:shadow-xl hover:scale-[1.02] border-2 border-transparent'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative w-full h-full">
                <img
                  src={option.image}
                  alt={option.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Selection overlay */}
                {draft.identity.ethnicity === option.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                {/* Label text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium text-center drop-shadow-lg">
                    {option.label}
                  </p>
                </div>
                
                {/* Selection indicator */}
                {draft.identity.ethnicity === option.id && (
                  <motion.div
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-pink-500" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Skin Tone</h2>
        <p className="text-dark-400 mb-6">Choose your character's skin tone</p>
        <div className="flex flex-wrap gap-4">
          {skinToneOptions.map((tone) => (
            <div
              key={tone}
              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                draft.identity.skinTone === tone
                  ? 'border-pink-500 shadow-lg shadow-pink-500/20'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
              onClick={() => handleSkinToneSelect(tone)}
            >
              <div
                className="w-20 h-20 rounded-md"
                style={{ backgroundColor: tone }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Height</h2>
        <p className="text-dark-400 mb-6">Choose your character's height</p>
        <div className="flex flex-wrap gap-3">
          {heightOptions.map((height) => (
            <OptionPill
              key={height}
              label={height.charAt(0).toUpperCase() + height.slice(1).replace(/_/g, ' ')}
              isSelected={draft.body.height === height}
              onClick={() => handleHeightSelect(height)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
