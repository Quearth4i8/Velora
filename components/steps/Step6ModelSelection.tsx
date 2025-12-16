'use client';

import React from 'react';
import { useCharacterBuilder } from '@/lib/store';
import { CharacterStyle, AIModel } from '@/lib/types';
import { OptionPill } from '@/components/ui/OptionPill';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

const STYLE_OPTIONS = [
  {
    id: CharacterStyle.ANIME,
    label: 'Anime',
    description: 'Stylized anime character with vibrant colors',
    model: AIModel.ONEOBSESSION,
  },
  {
    id: CharacterStyle.REALISTIC,
    label: 'Realistic',
    description: 'Photorealistic character with lifelike details',
    model: AIModel.CYBERREALISTIC,
  },
  {
    id: CharacterStyle.ARTISTIC,
    label: 'Artistic',
    description: 'Digital art style with creative interpretation',
    model: AIModel.PERFECTDELIBERATE,
  },
];

const MODEL_OPTIONS = [
  {
    id: AIModel.CYBERREALISTIC,
    label: 'CyberRealistic',
    description: 'Best for realistic characters',
  },
  {
    id: AIModel.ONEOBSESSION,
    label: 'OneObsession',
    description: 'Perfect for anime style',
  },
  {
    id: AIModel.PERFECTDELIBERATE,
    label: 'PerfectDeliberate',
    description: 'Great for artistic styles',
  },
];

export function Step6ModelSelection({ onGenerate, isLoading }: { onGenerate: () => void; isLoading?: boolean }) {
  const { draft, setGeneration } = useCharacterBuilder();

  const handleStyleSelect = (style: CharacterStyle) => {
    const selectedModel = STYLE_OPTIONS.find(option => option.id === style)?.model;
    setGeneration({
      style,
      model: selectedModel || AIModel.CYBERREALISTIC,
      generationStatus: 'pending',
    });
  };

  const handleModelSelect = (model: AIModel) => {
    setGeneration({
      model,
      generationStatus: 'pending',
    });
  };

  const selectedStyle = draft.generation?.style;
  const selectedModel = draft.generation?.model;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose Character Style</h2>
        <p className="text-gray-400 mb-6">Select the artistic style for your character</p>
        
        <div className="grid gap-4">
          {STYLE_OPTIONS.map((option) => (
            <div
              key={option.id}
              onClick={() => handleStyleSelect(option.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                selectedStyle === option.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{option.label}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedStyle === option.id
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-600'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">AI Model Selection</h3>
        <p className="text-gray-400 mb-4">Choose the specific AI model (auto-selected based on style)</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODEL_OPTIONS.map((model) => (
            <OptionPill
              key={model.id}
              label={model.label}
              isSelected={selectedModel === model.id}
              onClick={() => selectedStyle && handleModelSelect(model.id)}
            />
          ))}
        </div>
      </div>

      {selectedStyle && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">
            ✓ Style and model selected. Ready to generate your character!
          </p>
        </div>
      )}

      {selectedStyle && selectedModel && (
        <div className="mt-8">
          <PrimaryCTAButton
            label="Generate Character"
            onClick={onGenerate}
            loading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
