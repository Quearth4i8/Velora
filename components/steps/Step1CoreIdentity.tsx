'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { AgeGroup, Ethnicity } from '@/lib/types';
import { ImageOptionCard } from '../ui/ImageOptionCard';
import { OptionPill } from '../ui/OptionPill';

const ethnicityOptions = [
  { id: Ethnicity.CAUCASIAN, label: 'Caucasian', image: '/images/ethnicity-caucasian.jpg' },
  { id: Ethnicity.AFRICAN, label: 'African', image: '/images/ethnicity-african.jpg' },
  { id: Ethnicity.ASIAN, label: 'Asian', image: '/images/ethnicity-asian.jpg' },
  { id: Ethnicity.MIDDLE_EASTERN, label: 'Middle Eastern', image: '/images/ethnicity-middle-eastern.jpg' },
  { id: Ethnicity.LATIN, label: 'Latin', image: '/images/ethnicity-latin.jpg' },
  { id: Ethnicity.MIXED, label: 'Mixed', image: '/images/ethnicity-mixed.jpg' },
];

export const Step1CoreIdentity: React.FC = () => {
  const { draft, setIdentity } = useCharacterBuilder();

  const handleAgeSelect = (age: AgeGroup) => {
    setIdentity({ ageGroup: age });
  };

  const handleEthnicitySelect = (ethnicity: Ethnicity) => {
    setIdentity({ ethnicity });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Age Group</h2>
        <p className="text-dark-400 mb-6">Select an age range</p>
        <div className="flex flex-wrap gap-3">
          {Object.values(AgeGroup).map((age) => (
            <OptionPill
              key={age}
              label={age}
              isSelected={draft.identity.ageGroup === age}
              onClick={() => handleAgeSelect(age)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-8">
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
    </motion.div>
  );
};
