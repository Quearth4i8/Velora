'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                index + 1 <= currentStep
                  ? 'bg-purple-500 text-white shadow-glow'
                  : 'bg-dark-700 text-dark-400'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {index + 1}
            </motion.div>
            <p className="text-xs mt-2 text-dark-400 text-center max-w-20 truncate">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="w-full bg-dark-700 h-1 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <p className="text-xs text-dark-400 text-center">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
};
