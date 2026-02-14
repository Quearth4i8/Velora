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

const slimeHairStyleOptions = [
  {
    id: HairStyle.LONG,
    label: 'Classic',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.STRAIGHT,
    label: 'Fluid',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.BANGS,
    label: 'Tendril',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.BRAIDS,
    label: 'Bubble',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.BUN,
    label: 'Fully Amorphous',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.PONYTAIL,
    label: 'Floating',
    image: '/images/velora.png',
  },
  {
    id: HairStyle.BOB,
    label: 'Color-Shift',
    image: '/images/velora.png',
  },
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
  { id: ClothingStyle.CUTE, label: 'Cute', image: '/clothes/cute.jpg', description: 'Adorable and charming style' },
  { id: ClothingStyle.EDGY, label: 'Edgy', image: '/clothes/edgy.jpg', description: 'Alternative and rebellious look' },
  { id: ClothingStyle.ELEGANT, label: 'Elegant', image: '/clothes/elegent.jpg', description: 'Sophisticated and refined look' },
  { id: ClothingStyle.FANTASY, label: 'Fantasy', image: '/clothes/fantasy.jpg', description: 'Magical and fantasy-themed outfit' },
  { id: ClothingStyle.FORMAL, label: 'Formal', image: '/clothes/formal.png', description: 'Elegant formal outfit' },
  { id: ClothingStyle.SPORTY, label: 'Sporty', image: '/clothes/sport.jpg', description: 'Athletic and activewear style' },
  { id: ClothingStyle.TRADITIONAL, label: 'Traditional', image: '/clothes/traditional.jpg', description: 'Cultural and traditional attire' },
  { id: ClothingStyle.LINGERIE, label: 'Lingerie', image: '/clothes/lingerie.jpg', description: 'Intimate apparel' },
  { id: ClothingStyle.BIKINI, label: 'Bikini', image: '/clothes/bikini.jpg', description: 'Swimwear style' },
  { id: ClothingStyle.UNDERWEAR, label: 'Underwear', image: '/clothes/underwear.jpg', description: 'Basic undergarments' },
  { id: ClothingStyle.REVEALING, label: 'Revealing', image: '/clothes/revealing.jpg', description: 'Bold and revealing outfit' },
  { id: ClothingStyle.BODYSUIT, label: 'Bodysuit', image: '/clothes/bodysuit.jpg', description: 'Form-fitting bodysuit' },
  { id: ClothingStyle.NIPPLE_PASTIES, label: 'Nipple Pasties', image: '/clothes/Nipple Pasties.jpg', description: 'Minimal coverage' },
  { id: ClothingStyle.NAKED, label: 'Nude', image: '/clothes/nude.jpg', description: 'No clothing' },
  { id: ClothingStyle.CUSTOM, label: 'Custom', image: '/images/clothing-custom.jpg', description: 'Design your own outfit' },
];

export const Step3HairFace: React.FC = () => {
  const { draft, setAppearance } = useCharacterBuilder();

  const isAnimeStyle = draft.generation?.style === CharacterStyle.ANIME;
  const eyeTypeOptions = isAnimeStyle ? animeEyeTypeOptions : realisticEyeTypeOptions;

  const isSlimePreset =
    (draft.stylePreset || '').toLowerCase() === 'slime-girl' || (draft.mainTag || '').toLowerCase().includes('slime girl');

  const resolvedHairStyleOptions = isSlimePreset ? slimeHairStyleOptions : hairStyleOptions;

  React.useEffect(() => {
    if (!draft.appearance.eyeType) return;

    const allowedEyeTypes = new Set(eyeTypeOptions.map((option) => option.id));
    if (!allowedEyeTypes.has(draft.appearance.eyeType)) {
      setAppearance({ eyeType: null });
    }
  }, [draft.appearance.eyeType, eyeTypeOptions, setAppearance]);

  React.useEffect(() => {
    if (!draft.appearance.hairStyle) return;

    const allowedHairStyles = new Set(resolvedHairStyleOptions.map((option) => option.id));
    if (!allowedHairStyles.has(draft.appearance.hairStyle)) {
      setAppearance({ hairStyle: null });
    }
  }, [draft.appearance.hairStyle, resolvedHairStyleOptions, setAppearance]);

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
          {resolvedHairStyleOptions.map((option) => (
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {clothingOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              description={option.description}
              isSelected={draft.appearance.clothing === option.id}
              onClick={() => handleClothingSelect(option.id as ClothingStyle)}
              aspectRatio="portrait"
            />
          ))}
        </div>

        {draft.appearance.clothing === ClothingStyle.CUSTOM && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-xl p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-pink-600" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-dark-800 rounded-lg shrink-0">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Design Your Style</h3>
                  <p className="text-dark-400 text-sm mb-4">Describe exactly what you want your character to wear.</p>
                  <textarea
                    value={draft.appearance.customClothing || ''}
                    onChange={(e) => setAppearance({ customClothing: e.target.value })}
                    placeholder="e.g. A futuristic white bodysuit with glowing blue lines, high collar, and tactical boots..."
                    className="w-full h-24 bg-dark-900/50 border border-dark-700/50 rounded-lg p-4 text-white placeholder-dark-500 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
