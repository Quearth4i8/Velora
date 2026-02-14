'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { Physique, ChestSize, ButtSize } from '@/lib/types';
import { ImageOptionCard } from '../ui/ImageOptionCard';

const physiqueOptions = [
  { id: Physique.CHILDLIKE, label: 'Childlike', image: '/body shape/body type/childlike.jpg' },
  { id: Physique.PETITE, label: 'Petite', image: '/body shape/body type/petite.jpg' },
  { id: Physique.SLIM, label: 'Slim', image: '/body shape/body type/slim.jpg' },
  { id: Physique.ATHLETIC, label: 'Athletic', image: '/body shape/body type/athletic.jpg' },
  { id: Physique.THICC, label: 'Thicc', image: '/body shape/body type/thicc.jpg' },
  { id: Physique.CURVY, label: 'Curvy', image: '/body shape/body type/curvy.jpg' },
  { id: Physique.BBW, label: 'BBW', image: '/body shape/body type/BBW.jpg' },
];

const chestOptions = [
  { id: ChestSize.FLAT, label: 'Flat', image: '/body shape/chest size/flat.jpg' },
  { id: ChestSize.SMALL, label: 'Small', image: '/body shape/chest size/small.jpg' },
  { id: ChestSize.AVERAGE, label: 'Medium', image: '/body shape/chest size/medium.jpg' },
  { id: ChestSize.BIG, label: 'Big', image: '/body shape/chest size/big.jpg' },
  { id: ChestSize.HUGE, label: 'Huge', image: '/body shape/chest size/huge.jpg' },
];

const buttOptions = [
  { id: ButtSize.FLAT, label: 'Flat', image: '/body shape/butt size/flat.jpg' },
  { id: ButtSize.SMALL, label: 'Small', image: '/body shape/butt size/small.jpg' },
  { id: ButtSize.AVERAGE, label: 'Average', image: '/body shape/butt size/medium.jpg' },
  { id: ButtSize.BIG, label: 'Big', image: '/body shape/butt size/big.jpg' },
  { id: ButtSize.HUGE, label: 'Huge', image: '/body shape/butt size/huge.jpg' },
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
          {physiqueOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.physique === option.id}
              onClick={() => handlePhysiqueSelect(option.id as Physique)}
              aspectRatio="portrait"
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Chest Size</h2>
        <p className="text-dark-400 mb-6">Choose chest proportions</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {chestOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.chestSize === option.id}
              onClick={() => handleChestSelect(option.id as ChestSize)}
              aspectRatio="portrait"
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Butt Size</h2>
        <p className="text-dark-400 mb-6">Choose butt proportions</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {buttOptions.map((option) => (
            <ImageOptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              imageUrl={option.image}
              isSelected={draft.body.buttSize === option.id}
              onClick={() => handleButtSelect(option.id as ButtSize)}
              aspectRatio="portrait"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
