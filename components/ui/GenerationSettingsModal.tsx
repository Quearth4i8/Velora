'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASPECT_RATIO_OPTIONS, getDimensionsFromAspectRatio } from '@/config/aspect-ratios';
import { characterAPI } from '@/lib/api';

interface GenerationSettings {
  steps: number;
  cfgScale: number;
  aspectRatio: string;
  sampler: string;
  seed: number;
  additionalTags?: string;
  isFuta: boolean;
}

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  selectedModel?: string | null;
  characterId?: string; // Add characterId to save futanari to character
}

export function GenerationSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
  disabled = false,
  selectedModel,
  characterId
}: GenerationSettingsModalProps) {
  const handleFutanariToggle = async () => {
    const newFutaValue = !settings.isFuta;
    
    // Update local settings immediately
    onSettingsChange({ ...settings, isFuta: newFutaValue });
    
    // Also save to character if characterId is provided
    if (characterId) {
      try {
        await characterAPI.updateCharacterDirect(characterId, {
          futanari: newFutaValue
        });
      } catch (error) {
        console.error('Error saving futanari to character:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-dark-800 rounded-2xl border border-dark-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Generation Settings</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Steps */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">Steps: {settings.steps}</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.steps}
                  onChange={(e) => onSettingsChange({ ...settings, steps: parseInt(e.target.value) })}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* CFG Scale */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">CFG Scale: {settings.cfgScale}</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={settings.cfgScale}
                  onChange={(e) => onSettingsChange({ ...settings, cfgScale: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">Aspect Ratio</label>
                <select
                  value={settings.aspectRatio}
                  onChange={(e) => onSettingsChange({ ...settings, aspectRatio: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                >
                  {ASPECT_RATIO_OPTIONS.map((option) => {
                    const dims = getDimensionsFromAspectRatio(option.id, selectedModel);
                    return (
                      <option key={option.id} value={option.id}>
                        {option.label} ({dims.width}x{dims.height})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sampler */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">Sampler</label>
                <select
                  value={settings.sampler}
                  onChange={(e) => onSettingsChange({ ...settings, sampler: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                >
                  <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
                  <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
                  <option value="Euler a">Euler a</option>
                  <option value="Euler">Euler</option>
                  <option value="DDIM">DDIM</option>
                </select>
              </div>

              {/* Additional Tags */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">Additional Tags</label>
                <textarea
                  value={settings.additionalTags || ''}
                  onChange={(e) => onSettingsChange({ ...settings, additionalTags: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm resize-none"
                  rows={3}
                  placeholder="Enter additional tags separated by commas (e.g., detailed, high quality, 4k)..."
                />
              </div>

              {/* Futa Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-dark-300 text-sm">Futanari Content</label>
                <button
                  onClick={handleFutanariToggle}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                    settings.isFuta
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 shadow-lg shadow-pink-500/30'
                      : 'bg-dark-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      settings.isFuta ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Seed */}
              <div>
                <label className="text-dark-300 text-sm block mb-2">Seed</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={settings.seed}
                    onChange={(e) => onSettingsChange({ ...settings, seed: parseInt(e.target.value) || -1 })}
                    className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                    placeholder="-1 for random"
                  />
                  <button
                    onClick={() => onSettingsChange({ ...settings, seed: Math.floor(Math.random() * 1000000) })}
                    className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-dark-700 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-dark-700/50 text-pink-300 rounded-lg border border-pink-600/30 hover:bg-pink-600/20 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onGenerate}
                disabled={isGenerating || disabled}
                className="relative px-6 py-3 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 text-white rounded-full text-sm font-bold hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 disabled:from-dark-600 disabled:via-dark-700 disabled:to-dark-800 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 border border-pink-500/30"
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Magic...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7m0 0l7-7" />
                    </svg>
                    Generate Image
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
