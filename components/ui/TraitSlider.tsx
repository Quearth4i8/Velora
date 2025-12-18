'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';

interface TraitSliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const TraitSlider: React.FC<TraitSliderProps> = ({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}) => {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-dark-300">{label}</label>
        <motion.span
          className="text-xs font-semibold text-pink-400 bg-dark-800 px-3 py-1 rounded-full"
          key={value}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {value}
        </motion.span>
      </div>

      <Slider.Root
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={min}
        max={max}
        step={step}
        className="relative flex items-center w-full h-6 select-none touch-none"
      >
        <Slider.Track className="relative flex-grow h-2 bg-dark-700 rounded-full">
          <Slider.Range className="absolute h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-pink-500 rounded-full border-2 border-pink-400 shadow-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all"
          aria-label={label}
        />
      </Slider.Root>

      <div className="flex justify-between text-xs text-dark-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </motion.div>
  );
};
