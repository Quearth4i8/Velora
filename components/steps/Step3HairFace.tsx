'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { HairStyle, HairColor, EyeColor } from '@/lib/types';
import { ImageOptionCard } from '../ui/ImageOptionCard';
import { OptionPill } from '../ui/OptionPill';
import { ColorPicker } from '../ui/ColorPicker';

const hairStyleOptions = [
  { id: HairStyle.STRAIGHT, label: 'Straight', image: '/images/hair-straight.jpg' },
  { id: HairStyle.BANGS, label: 'Bangs', image: '/images/hair-bangs.jpg' },
  { id: HairStyle.BRAIDS, label: 'Braids', image: '/images/hair-braids.jpg' },
  { id: HairStyle.CURLY, label: 'Curly', image: '/images/hair-curly.jpg' },
  { id: HairStyle.BUN, label: 'Bun', image: '/images/hair-bun.jpg' },
  { id: HairStyle.PONYTAIL, label: 'Ponytail', image: '/images/hair-ponytail.jpg' },
  { id: HairStyle.BOB, label: 'Bob', image: '/images/hair-bob.jpg' },
];

const hairColors = [
  { label: 'Black', value: HairColor.BLACK },
  { label: 'Brown', value: HairColor.BROWN },
  { label: 'Blonde', value: HairColor.BLONDE },
  { label: 'Red', value: HairColor.RED },
  { label: 'Purple', value: HairColor.PURPLE },
  { label: 'Pink', value: HairColor.PINK },
  { label: 'Blue', value: HairColor.BLUE },
  { label: 'Green', value: HairColor.GREEN },
  { label: 'Silver', value: HairColor.SILVER },
];

const eyeColorOptions = [
  { id: EyeColor.BROWN, label: 'Brown', image: '/images/eyes-brown.jpg' },
  { id: EyeColor.BLUE, label: 'Blue', image: '/images/eyes-blue.jpg' },
  { id: EyeColor.GREEN, label: 'Green', image: '/images/eyes-green.jpg' },
  { id: EyeColor.HAZEL, label: 'Hazel', image: '/images/eyes-hazel.jpg' },
  { id: EyeColor.GRAY, label: 'Gray', image: '/images/eyes-gray.jpg' },
  { id: EyeColor.AMBER, label: 'Amber', image: '/images/eyes-amber.jpg' },
  { id: EyeColor.VIOLET, label: 'Violet', image: '/images/eyes-violet.jpg' },
];

export const Step3HairFace: React.FC = () => {
  const { draft, setAppearance } = useCharacterBuilder();

  const handleHairStyleSelect = (style: HairStyle) => {
    setAppearance({ hairStyle: style });
  };

  const handleHairColorSelect = (color: string) => {
    setAppearance({ hairColor: color as HairColor });
  };

  const handleEyeColorSelect = (color: EyeColor) => {
    setAppearance({ eyeColor: color });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Hair Style</h2>
        <p className="text-dark-400 mb-6">Choose your hair style</p>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {hairStyleOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.appearance.hairStyle === option.id}
              onClick={() => handleHairStyleSelect(option.id as HairStyle)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Hair Color</h2>
        <p className="text-dark-400 mb-6">Select a hair color</p>
        <ColorPicker
          colors={hairColors}
          selectedColor={draft.appearance.hairColor}
          onColorSelect={handleHairColorSelect}
        />
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Eye Color</h2>
        <p className="text-dark-400 mb-6">Choose eye color</p>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {eyeColorOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.appearance.eyeColor === option.id}
              onClick={() => handleEyeColorSelect(option.id as EyeColor)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
