'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ColorPickerProps {
  colors: { label: string; value: string }[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onColorSelect,
}) => {
  return (
    <div className="flex gap-3 flex-wrap">
      {colors.map((color) => (
        <motion.button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          className="relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              selectedColor === color.value
                ? 'border-white shadow-glow-lg'
                : 'border-dark-600 hover:border-purple-400'
            }`}
            style={{ backgroundColor: color.value }}
          />
          {selectedColor === color.value && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
