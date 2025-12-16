'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface AnimatedCheckmarkProps {
  isVisible: boolean;  
  size?: number;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  isVisible,
  size = 24,
}) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <Check size={size} className="text-green-400" strokeWidth={3} />
    </motion.div>
  );
};
