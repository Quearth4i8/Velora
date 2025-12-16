'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  children,
  delay = 0,
}) => {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-dark-400 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
};
