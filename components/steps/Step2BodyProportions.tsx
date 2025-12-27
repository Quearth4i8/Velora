'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { Ethnicity, Height } from '@/lib/types';
import { getSkinToneOptionsForRace } from '@/config/character-config';
import { ImageOptionCard } from '../ui/ImageOptionCard';
import { OptionPill } from '../ui/OptionPill';

const ethnicityOptions = [
  { id: Ethnicity.EAST_ASIAN, label: 'East Asian', image: '/images/ethnicity-asian.jpg' },
  { id: Ethnicity.KOREAN, label: 'Korean', image: '/images/ethnicity-asian.jpg' },
  { id: Ethnicity.JAPANESE, label: 'Japanese', image: '/images/ethnicity-asian.jpg' },
  { id: Ethnicity.BRAZILIAN, label: 'Brazilian', image: '/images/ethnicity-latin.jpg' },
  { id: Ethnicity.COLOMBIAN, label: 'Colombian', image: '/images/ethnicity-latin.jpg' },
  { id: Ethnicity.LATIN_AMERICAN, label: 'Latin American', image: '/images/ethnicity-latin.jpg' },
  { id: Ethnicity.RUSSIAN, label: 'Russian', image: '/images/ethnicity-caucasian.jpg' },
  { id: Ethnicity.UKRAINIAN, label: 'Ukrainian', image: '/images/ethnicity-caucasian.jpg' },
  { id: Ethnicity.SCANDINAVIAN, label: 'Scandinavian', image: '/images/ethnicity-caucasian.jpg' },
  { id: Ethnicity.ITALIAN, label: 'Italian', image: '/images/ethnicity-caucasian.jpg' },
  { id: Ethnicity.LEBANESE, label: 'Lebanese', image: '/images/ethnicity-middle-eastern.jpg' },
  { id: Ethnicity.MIXED_EXOTIC, label: 'Mixed / Exotic', image: '/images/ethnicity-mixed.jpg' },
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ethnicityOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.identity.ethnicity === option.id}
              onClick={() => handleEthnicitySelect(option.id as Ethnicity)}
            />
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
