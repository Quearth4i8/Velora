'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ImageOptionCardProps {
  id: string;
  label: string;
  imageUrl: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const ImageOptionCard: React.FC<ImageOptionCardProps> = ({
  id,
  label,
  imageUrl,
  isSelected,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`relative w-full h-40 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
          isSelected
            ? 'border-purple-500 shadow-glow-lg'
            : 'border-dark-600 hover:border-purple-400'
        }`}
      >
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover"
        />

        {isSelected && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {isSelected && (
          <motion.div
            className="absolute top-2 right-2 bg-purple-500 rounded-full p-1.5 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-dark-300 text-center truncate">
        {label}
      </p>
    </motion.button>
  );
};
