'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';
import { CHARACTER_CONFIG } from '@/config/character-config';

const styleOptions = [
  { id: CharacterStyle.ANIME, label: 'Anime', description: 'Stylized anime aesthetic' },
  { id: CharacterStyle.REALISTIC, label: 'Realistic', description: 'Photorealistic appearance' },
  { id: CharacterStyle.ARTISTIC, label: 'Artistic', description: 'Artistic and creative style' },
];

export const Step1ImageStyle: React.FC = () => {
  const { draft, setGeneration, updateCharacter } = useCharacterBuilder();

  const selectedStyle = draft.generation?.style;
  const presets = selectedStyle ? CHARACTER_CONFIG.imageStylePresets[selectedStyle] ?? [] : [];

  const selectedPresetId = React.useMemo(() => {
    if (!selectedStyle) return null;

    if (typeof draft.stylePreset === 'string' && draft.stylePreset.trim()) {
      return draft.stylePreset;
    }

    const matchByLora = presets.find((preset) =>
      preset.loraName && typeof draft.loraName === 'string' ? preset.loraName === draft.loraName : false
    );
    if (matchByLora) return matchByLora.id;

    const matchByMainTag = presets.find((preset) =>
      preset.mainTag && typeof draft.mainTag === 'string' ? preset.mainTag === draft.mainTag : false
    );
    if (matchByMainTag) return matchByMainTag.id;

    return null;
  }, [draft.loraName, draft.mainTag, draft.stylePreset, presets, selectedStyle]);

  const handleStyleSelect = (style: CharacterStyle) => {
    const model = automatic1111API.getModelForStyle(style);
    setGeneration({ style, model });

    updateCharacter({
      stylePreset: undefined,
      mainTag: undefined,
      loraName: undefined,
      loraNames: undefined,
      loraWeight: null,
      specialPrompt: undefined,
      specialNegativePrompt: undefined,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;

    updateCharacter({
      stylePreset: preset.id,
      mainTag: preset.mainTag || undefined,
      loraName: preset.loraNames && preset.loraNames.length > 0 ? undefined : preset.loraName || undefined,
      loraNames: preset.loraNames && preset.loraNames.length > 0 ? preset.loraNames : undefined,
      loraWeight: typeof preset.loraWeight === 'number' ? preset.loraWeight : null,
      specialPrompt: preset.specialPrompt || undefined,
      specialNegativePrompt: 'specialNegativePrompt' in preset ? (preset as { specialNegativePrompt?: string }).specialNegativePrompt : undefined,
    });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Image Style</h2>
        <p className="text-dark-400 mb-6">Choose the artistic style for your character</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {styleOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleStyleSelect(option.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                draft.generation?.style === option.id
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                  : 'border-dark-700 bg-dark-950/40 hover:border-pink-500/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="font-semibold text-white mb-1">{option.label}</h3>
              <p className="text-sm text-dark-400">{option.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedStyle && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedStyle === CharacterStyle.REALISTIC ? 'Realistic Preset' : 'Race Preset'}
          </h3>
          <p className="text-dark-400 mb-6">
            {selectedStyle === CharacterStyle.REALISTIC
              ? 'Pick an aesthetic preset to auto-select a LoRA'
              : 'Pick a race preset to auto-select a LoRA'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {presets.map((preset) => (
              <motion.button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`rounded-xl border transition-all duration-300 overflow-hidden text-left ${
                  selectedPresetId === preset.id
                    ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                    : 'border-dark-700 bg-dark-950/40 hover:border-pink-500/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset.imageSrc ? (
                  <img
                    src={preset.imageSrc}
                    alt={preset.label}
                    className="h-24 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-24 bg-gradient-to-br from-dark-800/40 to-dark-900/40" />
                )}
                <div className="p-3">
                  <div className="text-sm font-semibold text-white">{preset.label}</div>
                  {(preset.description || preset.loraName) && (
                    <div className="mt-1 text-xs text-dark-400">
                      {preset.description ? preset.description : preset.loraName ? `LoRA: ${preset.loraName}` : ''}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
