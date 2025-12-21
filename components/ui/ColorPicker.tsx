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
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
      {colors.map((color) => (
        <motion.button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          className="group relative flex flex-col items-center space-y-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Color circle with enhanced styling */}
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full border-3 transition-all duration-300 shadow-lg ${
                selectedColor === color.value
                  ? 'border-pink-500 ring-2 ring-pink-400 ring-offset-2 ring-offset-dark-900 shadow-glow-lg'
                  : 'border-dark-600 group-hover:border-pink-400 group-hover:shadow-xl'
              }`}
              style={{ backgroundColor: color.value }}
            />
            
            {/* Selected indicator */}
            {selectedColor === color.value && (
              <motion.div
                className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Color label */}
          <span className={`text-xs font-medium transition-colors duration-300 ${
            selectedColor === color.value
              ? 'text-pink-400'
              : 'text-dark-400 group-hover:text-dark-200'
          }`}>
            {color.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
