'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ASPECT_RATIOS, AspectRatioId } from '@/config/aspect-ratios';

interface FormatSelectorProps {
  selectedFormat: AspectRatioId;
  onFormatChange: (format: AspectRatioId) => void;
  disabled?: boolean;
}

const FORMATS = [
  { id: 'square' as AspectRatioId, label: 'Square', ratio: '1:1' },
  { id: 'landscape' as AspectRatioId, label: 'Landscape', ratio: '4:3' },
  { id: 'portrait' as AspectRatioId, label: 'Portrait', ratio: '3:4' },
];

export function FormatSelector({ selectedFormat, onFormatChange, disabled = false }: FormatSelectorProps) {
  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-dark-800/50 rounded-2xl border border-pink-500/30 backdrop-blur-sm">
      {/* Camera Icon */}
      <div className="flex items-center justify-center w-10 h-10 bg-pink-600/20 rounded-xl border border-pink-500/50">
        <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      {/* Format Options */}
      <div className="flex space-x-3">
        {FORMATS.map((format) => (
          <motion.button
            key={format.id}
            onClick={() => !disabled && onFormatChange(format.id)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
              selectedFormat === format.id
                ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/30 border-2 border-pink-400'
                : 'bg-dark-700/50 text-pink-300 border border-pink-500/30 hover:bg-pink-600/20 hover:border-pink-400/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Format Icon */}
            <div className={`w-8 h-8 rounded-md mb-2 flex items-center justify-center ${
              selectedFormat === format.id ? 'bg-white/20' : 'bg-pink-600/20'
            }`}>
              <div className={`w-4 h-4 rounded-sm ${
                selectedFormat === format.id ? 'bg-white' : 'bg-pink-300'
              }`} />
            </div>

            {/* Format Label */}
            <span className="text-xs font-medium">{format.label}</span>
            
            {/* Ratio Badge */}
            <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ${
              selectedFormat === format.id 
                ? 'bg-white/20 text-white' 
                : 'bg-pink-600/20 text-pink-300'
            }`}>
              {format.ratio}
            </span>

            {/* Selection Indicator */}
            {selectedFormat === format.id && (
              <motion.div
                layoutId="selectedFormat"
                className="absolute inset-0 rounded-xl border-2 border-white pointer-events-none"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
