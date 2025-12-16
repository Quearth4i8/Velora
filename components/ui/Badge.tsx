'use client';

import React from 'react';
import { motion } from 'framer-motion';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const variantClasses = {
    primary: 'bg-purple-500/20 text-purple-300 border-purple-600',
    secondary: 'bg-dark-700 text-dark-300 border-dark-600',
    success: 'bg-green-500/20 text-green-300 border-green-600',
    error: 'bg-red-500/20 text-red-300 border-red-600',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-600',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <motion.span
      className={`inline-block rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} font-medium`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.span>
  );
};
