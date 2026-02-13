'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';
import { CHARACTER_CONFIG } from '@/config/character-config';

type StylePreset = (typeof CHARACTER_CONFIG.imageStylePresets)[CharacterStyle][number];

const styleOptions = [
  { id: CharacterStyle.ANIME, label: 'Anime', description: 'Stylized anime aesthetic', imageSrc: '/image style/anime (perfectIllustrationXL_v3).jpg' },
  { id: CharacterStyle.ANIME_ILLUSTRIOUS, label: 'Anime Illustrative', description: 'High-quality anime illustration style', imageSrc: '/image style/anime illustrative (waiIllustriousSDXL_v160).jpg' },
  { id: CharacterStyle.MOE_FUSSION, label: 'Moe Fussion', description: 'Moe-style anime renders', imageSrc: '/image style/moe fussion (moeFussionV1.5.0_Z_vz).jpg' },
  { id: CharacterStyle.REALISTIC, label: 'Realistic', description: 'Photorealistic appearance', imageSrc: '/image style/realastic.jpg' },
  { id: CharacterStyle.ARTISTIC, label: 'Artistic', description: 'Artistic and creative style', imageSrc: '/image style/artistic (perfectdeliberate_v30).jpg' },
  { id: CharacterStyle.SPECIAL, label: 'Special', description: 'Monster girls and exotic species', imageSrc: '/image style/special (perfectIllustriousXL_v3).jpg' },
];

export const Step1ImageStyle: React.FC = () => {
  const { draft, setGeneration, updateCharacter } = useCharacterBuilder();
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedStyle = draft.generation?.style;
  const allPresets = selectedStyle ? CHARACTER_CONFIG.imageStylePresets[selectedStyle] ?? [] : [];

  const presets = React.useMemo(() => {
    if (!searchQuery.trim()) return allPresets;
    const query = searchQuery.toLowerCase();
    return allPresets.filter((preset: StylePreset) =>
      preset.label.toLowerCase().includes(query) ||
      (preset.description && preset.description.toLowerCase().includes(query)) ||
      (preset.loraName && preset.loraName.toLowerCase().includes(query))
    );
  }, [allPresets, searchQuery]);

  const selectedPresetId = React.useMemo(() => {
    if (!selectedStyle) return null;

    if (typeof draft.stylePreset === 'string' && draft.stylePreset.trim()) {
      return draft.stylePreset;
    }

    const matchByLora = allPresets.find((preset: StylePreset) =>
      preset.loraName && typeof draft.loraName === 'string' ? preset.loraName === draft.loraName : false
    );
    if (matchByLora) return matchByLora.id;

    const matchByMainTag = allPresets.find((preset: StylePreset) =>
      preset.mainTag && typeof draft.mainTag === 'string' ? preset.mainTag === draft.mainTag : false
    );
    if (matchByMainTag) return matchByMainTag.id;

    return null;
  }, [draft.loraName, draft.mainTag, draft.stylePreset, allPresets, selectedStyle]);

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
    const preset = allPresets.find((item: StylePreset) => item.id === presetId);
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {styleOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleStyleSelect(option.id)}
              className={`group relative aspect-square rounded-xl border-2 transition-all duration-300 overflow-hidden ${draft.generation?.style === option.id
                ? 'border-pink-500 shadow-lg shadow-pink-500/30 ring-2 ring-pink-500/20'
                : 'border-dark-700 hover:border-pink-500/50'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <img
                src={option.imageSrc}
                alt={option.label}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Selected Overlay */}
              {draft.generation?.style === option.id && (
                <div className="absolute inset-0 bg-pink-500/10" />
              )}
              
              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="font-semibold text-white text-sm mb-0.5">{option.label}</h3>
                <p className="text-xs text-white/60 line-clamp-1">{option.description}</p>
              </div>
              
              {/* Selection Indicator */}
              {draft.generation?.style === option.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {selectedStyle && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedStyle === CharacterStyle.REALISTIC ? 'Realistic Preset' : 'Race Preset'}
          </h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-dark-400">
                {selectedStyle === CharacterStyle.REALISTIC
                  ? 'Pick an aesthetic preset to auto-select a LoRA'
                  : 'Pick a race preset to auto-select a LoRA'}
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets..."
                className="w-full md:w-64 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-dark-500"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-500 w-4 h-4 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="bg-dark-900/30 rounded-xl border border-dark-800 p-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
            {presets.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {presets.map((preset: StylePreset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden text-left relative group ${selectedPresetId === preset.id
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
                        className="h-28 w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-28 bg-gradient-to-br from-dark-800/40 to-dark-900/40 flex items-center justify-center">
                        <span className="text-3xl opacity-20">✨</span>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="text-sm font-semibold text-white group-hover:text-pink-300 transition-colors">{preset.label}</div>
                      {(preset.description || preset.loraName) && (
                        <div className="mt-1 text-xs text-dark-400 line-clamp-2">
                          {preset.description ? preset.description : preset.loraName ? `LoRA: ${preset.loraName}` : ''}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                <span className="text-4xl mb-3">🔍</span>
                <p>No presets found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-pink-400 hover:text-pink-300 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
