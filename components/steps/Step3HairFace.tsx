'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle, HairStyle, HairColor, EyeColor, EyeType, ClothingStyle } from '@/lib/types';
import { ImageOptionCard } from '../ui/ImageOptionCard';
import { OptionPill } from '../ui/OptionPill';
import { ColorPicker } from '../ui/ColorPicker';

const hairStyleOptions = [
  { id: HairStyle.LONG, label: 'Long', image: '/hair/long hair.jpg' },
  { id: HairStyle.STRAIGHT, label: 'Straight', image: '/hair/straight hair.jpg' },
  { id: HairStyle.BANGS, label: 'Bangs', image: '/hair/bangs hair.jpg' },
  { id: HairStyle.BRAIDS, label: 'Braids', image: '/hair/braids hair.jpg' },
  { id: HairStyle.CURLY, label: 'Curly', image: '/hair/curly hair.jpg' },
  { id: HairStyle.BUN, label: 'Bun', image: '/hair/bun hair.jpg' },
  { id: HairStyle.PONYTAIL, label: 'Ponytail', image: '/hair/ponytail hair.jpg' },
  { id: HairStyle.BOB, label: 'Bob', image: '/hair/bob hair.jpg' },
];

const hairColors = [
  { label: 'Black', value: HairColor.BLACK },
  { label: 'Dark Brown', value: HairColor.DARK_BROWN },
  { label: 'Brown', value: HairColor.BROWN },
  { label: 'Light Brown', value: HairColor.LIGHT_BROWN },
  { label: 'Blonde', value: HairColor.BLONDE },
  { label: 'Platinum Blonde', value: HairColor.PLATINUM_BLONDE },
  { label: 'White', value: HairColor.WHITE },
  { label: 'Red', value: HairColor.RED },
  { label: 'Maroon', value: HairColor.MAROON },
  { label: 'Auburn', value: HairColor.AUBURN },
  { label: 'Orange', value: HairColor.ORANGE },
  { label: 'Purple', value: HairColor.PURPLE },
  { label: 'Pink', value: HairColor.PINK },
  { label: 'Blue', value: HairColor.BLUE },
  { label: 'Teal', value: HairColor.TEAL },
  { label: 'Green', value: HairColor.GREEN },
  { label: 'Turquoise', value: HairColor.TURQUOISE },
  { label: 'Silver', value: HairColor.SILVER },
  { label: 'Gray', value: HairColor.GRAY },
  { label: 'Lavender', value: HairColor.LAVENDER },
];

const eyeColorOptions = [
  { id: EyeColor.BROWN, label: 'Brown', image: '/eyes/brown eye.jpg' },
  { id: EyeColor.BLUE, label: 'Blue', image: '/eyes/blue eye.jpg' },
  { id: EyeColor.GREEN, label: 'Green', image: '/eyes/green eye.jpg' },
  { id: EyeColor.HAZEL, label: 'Hazel', image: '/eyes/hazel eye.jpg' },
  { id: EyeColor.GRAY, label: 'Gray', image: '/eyes/grey eye.jpg' },
  { id: EyeColor.AMBER, label: 'Amber', image: '/eyes/amber eye.jpg' },
  { id: EyeColor.VIOLET, label: 'Violet', image: '/eyes/violet eye.jpg' },
];

const animeEyeTypeOptions = [
  { id: EyeType.BIG_ROUND, label: 'Big round eyes', image: '/images/velora.png' },
  { id: EyeType.TAREME, label: 'Droopy eyes (tareme)', image: '/images/velora.png' },
  { id: EyeType.TSURIME, label: 'Sharp eyes (tsurime)', image: '/images/velora.png' },
  { id: EyeType.HALF_LIDDED, label: 'Half-lidded eyes', image: '/images/velora.png' },
  { id: EyeType.SLEEPY, label: 'Sleepy eyes', image: '/images/velora.png' },
  { id: EyeType.SPARKLY, label: 'Sparkly eyes', image: '/images/velora.png' },
  { id: EyeType.NARROW, label: 'Narrow eyes', image: '/images/velora.png' },
  { id: EyeType.PIERCING, label: 'Piercing eyes', image: '/images/velora.png' },
];

const realisticEyeTypeOptions = [
  { id: EyeType.NORMAL, label: 'Normal', image: '/images/velora.png' },
  { id: EyeType.FOX, label: 'Fox', image: '/images/velora.png' },
  { id: EyeType.SIREN, label: 'Siren', image: '/images/velora.png' },
  { id: EyeType.CAT, label: 'Cat', image: '/images/velora.png' },
  { id: EyeType.DOE, label: 'Doe', image: '/images/velora.png' },
  { id: EyeType.WOLF, label: 'Wolf', image: '/images/velora.png' },
  { id: EyeType.EAGLE, label: 'Eagle', image: '/images/velora.png' },
  { id: EyeType.DRAGON, label: 'Dragon', image: '/images/velora.png' },
];

const clothingOptions = [
  { id: ClothingStyle.CASUAL, label: 'Casual', image: '/images/clothing-casual.jpg', description: 'Everyday casual wear like jeans and t-shirt' },
  { id: ClothingStyle.FORMAL, label: 'Formal', image: '/images/clothing-formal.jpg', description: 'Elegant formal wear like dresses and suits' },
  { id: ClothingStyle.SPORTY, label: 'Sporty', image: '/images/clothing-sporty.jpg', description: 'Athletic wear for sports and activities' },
  { id: ClothingStyle.ELEGANT, label: 'Elegant', image: '/images/clothing-elegant.jpg', description: 'Sophisticated evening wear and gowns' },
  { id: ClothingStyle.CUTE, label: 'Cute', image: '/images/clothing-cute.jpg', description: 'Adorable and charming outfits' },
  { id: ClothingStyle.EDGY, label: 'Edgy', image: '/images/clothing-edgy.jpg', description: 'Alternative and rebellious style' },
  { id: ClothingStyle.TRADITIONAL, label: 'Traditional', image: '/images/clothing-traditional.jpg', description: 'Cultural and traditional attire' },
  { id: ClothingStyle.FANTASY, label: 'Fantasy', image: '/images/clothing-fantasy.jpg', description: 'Magical and fantasy-themed outfits' },
];

export const Step3HairFace: React.FC = () => {
  const { draft, setAppearance } = useCharacterBuilder();

  const isAnimeStyle = draft.generation?.style === CharacterStyle.ANIME;
  const eyeTypeOptions = isAnimeStyle ? animeEyeTypeOptions : realisticEyeTypeOptions;

  React.useEffect(() => {
    if (!draft.appearance.eyeType) return;

    const allowedEyeTypes = new Set(eyeTypeOptions.map((option) => option.id));
    if (!allowedEyeTypes.has(draft.appearance.eyeType)) {
      setAppearance({ eyeType: null });
    }
  }, [draft.appearance.eyeType, eyeTypeOptions, setAppearance]);

  const handleHairStyleSelect = (style: HairStyle) => {
    setAppearance({ hairStyle: style });
  };

  const handleHairColorSelect = (color: string) => {
    setAppearance({ hairColor: color as HairColor });
  };

  const handleEyeColorSelect = (color: EyeColor) => {
    setAppearance({ eyeColor: color });
  };

  const handleEyeTypeSelect = (type: EyeType) => {
    setAppearance({ eyeType: type });
  };

  const handleClothingSelect = (clothing: ClothingStyle) => {
    setAppearance({ clothing });
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
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

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Eye Type</h2>
        <p className="text-dark-400 mb-6">Choose eye shape and style</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {eyeTypeOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.appearance.eyeType === option.id}
              onClick={() => handleEyeTypeSelect(option.id as EyeType)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Clothing Style</h2>
        <p className="text-dark-400 mb-6">Choose clothing style</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {clothingOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              description={option.description}
              isSelected={draft.appearance.clothing === option.id}
              onClick={() => handleClothingSelect(option.id as ClothingStyle)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
