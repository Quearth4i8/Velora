'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PrimaryCTAButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const PrimaryCTAButton: React.FC<PrimaryCTAButtonProps> = ({
  label,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${className}`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`relative px-4 py-3 rounded-lg transition-all duration-300 ${
          disabled
            ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-glow hover:shadow-glow-lg'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          </div>
        ) : (
          label
        )}
      </div>
    </motion.button>
  );
};
