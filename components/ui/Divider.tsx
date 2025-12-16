'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <motion.div
        className={`w-px bg-gradient-to-b from-dark-700 via-dark-600 to-dark-700 ${className}`}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3 }}
      />
    );
  }

  return (
    <motion.div
      className={`h-px bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 ${className}`}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};
