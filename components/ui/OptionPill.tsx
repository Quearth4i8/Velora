'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface OptionPillProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const OptionPill: React.FC<OptionPillProps> = ({
  label,
  isSelected,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div
        className={`relative px-4 py-2 rounded-full border-2 transition-all duration-300 ${
          isSelected
            ? 'border-pink-500 bg-pink-500/10 text-pink-300 shadow-glow'
            : 'border-dark-600 bg-dark-800 text-dark-300 hover:border-pink-400'
        }`}
      >
        {label}
      </div>
    </motion.button>
  );
};
