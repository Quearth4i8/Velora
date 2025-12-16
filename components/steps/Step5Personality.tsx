'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';

interface PersonalitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
}

const PersonalitySlider: React.FC<PersonalitySliderProps> = ({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        <span className="text-purple-400 font-bold text-lg">{value}</span>
      </div>
      
      <div className="relative">
        <div className="flex justify-between text-xs text-dark-400 mb-2">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(value - 1) * 11.11}%, #374151 ${(value - 1) * 11.11}%, #374151 100%)`,
            }}
          />
          
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <span key={num} className="w-8 text-center">
                {num}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Step5Personality: React.FC = () => {
  const { draft, setPersonality } = useCharacterBuilder();

  const handleTraitChange = (trait: keyof typeof draft.personality.traits, value: number) => {
    setPersonality({
      traits: {
        ...draft.personality.traits,
        [trait]: value,
      },
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
        <h2 className="text-3xl font-bold text-white mb-2">Personality Traits</h2>
        <p className="text-dark-400 mb-8">
          Adjust the sliders to define your character's personality. Use the number scale (1-10) to set the intensity of each trait.
        </p>
      </div>

      <div className="space-y-8">
        <PersonalitySlider
          label="Social Dynamics"
          value={draft.personality.traits.submissiveDominant}
          onChange={(value) => handleTraitChange('submissiveDominant', value)}
          leftLabel="Submissive"
          rightLabel="Dominant"
        />

        <PersonalitySlider
          label="Self-Confidence"
          value={draft.personality.traits.insecureConfident}
          onChange={(value) => handleTraitChange('insecureConfident', value)}
          leftLabel="Insecure"
          rightLabel="Confident"
        />

        <PersonalitySlider
          label="Emotional Expression"
          value={draft.personality.traits.coldPassionate}
          onChange={(value) => handleTraitChange('coldPassionate', value)}
          leftLabel="Cold"
          rightLabel="Passionate"
        />

        <PersonalitySlider
          label="Social Interaction"
          value={draft.personality.traits.reservedOutgoing}
          onChange={(value) => handleTraitChange('reservedOutgoing', value)}
          leftLabel="Reserved"
          rightLabel="Outgoing"
        />

        <PersonalitySlider
          label="Demeanor"
          value={draft.personality.traits.seriousPlayful}
          onChange={(value) => handleTraitChange('seriousPlayful', value)}
          leftLabel="Serious"
          rightLabel="Playful"
        />
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #8b5cf6;
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #8b5cf6;
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #a78bfa;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
        }

        .slider::-moz-range-thumb:hover {
          background: #a78bfa;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </motion.div>
  );
};
