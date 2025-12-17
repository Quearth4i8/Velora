'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { Physique, ChestSize, ButtSize } from '@/lib/types';
import { ImageOptionCard } from '../ui/ImageOptionCard';

const physiqueOptions = [
  { id: Physique.SLIM, label: 'Slim', image: '/images/physique-slim.jpg' },
  { id: Physique.ATHLETIC, label: 'Athletic', image: '/images/physique-athletic.jpg' },
  { id: Physique.AVERAGE, label: 'Average', image: '/images/physique-average.jpg' },
  { id: Physique.CURVY, label: 'Curvy', image: '/images/physique-curvy.jpg' },
  { id: Physique.BBW, label: 'BBW', image: '/images/physique-bbw.jpg' },
  { id: Physique.CHILDLIKE, label: 'Childlike', image: '/images/physique-childlike.jpg' },
  { id: Physique.PETITE, label: 'Petite', image: '/images/physique-petite.jpg' },
];

const chestOptions = [
  { id: ChestSize.FLAT, label: 'Flat', image: '/images/chest-flat.jpg' },
  { id: ChestSize.SMALL, label: 'Small', image: '/images/chest-small.jpg' },
  { id: ChestSize.AVERAGE, label: 'Average', image: '/images/chest-average.jpg' },
  { id: ChestSize.BIG, label: 'Big', image: '/images/chest-big.jpg' },
  { id: ChestSize.HUGE, label: 'Huge', image: '/images/chest-huge.jpg' },
];

const buttOptions = [
  { id: ButtSize.FLAT, label: 'Flat', image: '/images/butt-flat.jpg' },
  { id: ButtSize.SMALL, label: 'Small', image: '/images/butt-small.jpg' },
  { id: ButtSize.AVERAGE, label: 'Average', image: '/images/butt-average.jpg' },
  { id: ButtSize.BIG, label: 'Big', image: '/images/butt-big.jpg' },
  { id: ButtSize.HUGE, label: 'Huge', image: '/images/butt-huge.jpg' },
];

export const Step4BodyProportions: React.FC = () => {
  const { draft, setBody } = useCharacterBuilder();

  const handlePhysiqueSelect = (physique: Physique) => {
    setBody({ physique });
  };

  const handleChestSelect = (chest: ChestSize) => {
    setBody({ chestSize: chest });
  };

  const handleButtSelect = (butt: ButtSize) => {
    setBody({ buttSize: butt });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Physique</h2>
        <p className="text-dark-400 mb-6">Select body type</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {physiqueOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.physique === option.id}
              onClick={() => handlePhysiqueSelect(option.id as Physique)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Chest Size</h2>
        <p className="text-dark-400 mb-6">Choose chest proportions</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {chestOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.chestSize === option.id}
              onClick={() => handleChestSelect(option.id as ChestSize)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Butt Size</h2>
        <p className="text-dark-400 mb-6">Choose butt proportions</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {buttOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.buttSize === option.id}
              onClick={() => handleButtSelect(option.id as ButtSize)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
