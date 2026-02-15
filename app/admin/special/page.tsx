'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { characterAPI } from '@/lib/api';
import { CharacterDraft, CharacterStyle, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, EyeType, ClothingStyle, Environment, HairColor, EyeColor } from '@/lib/types';
import { useDialog } from '@/components/ui/DialogProvider';
import { 
  Sparkles, Crown, Save, Loader2, AlertTriangle, ChevronRight,
  Wand2, User, Palette, Brain, Camera
} from 'lucide-react';

const steps = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'personality', label: 'Personality', icon: Brain },
  { id: 'generation', label: 'Generation', icon: Camera },
];

export default function AdminSpecialPage() {
  const router = useRouter();
  const dialog = useDialog();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [draft, setDraft] = useState<Partial<CharacterDraft>>({
    name: '',
    characterType: 'special',
    currentStep: 1,
    identity: {
      age: 25,
      ethnicity: Ethnicity.MIXED_EXOTIC,
      skinTone: '#ffe0bd',
    },
    body: {
      height: Height.AVERAGE,
      physique: Physique.ATHLETIC,
      chestSize: ChestSize.AVERAGE,
      buttSize: ButtSize.AVERAGE,
    },
    appearance: {
      hairStyle: HairStyle.STRAIGHT,
      hairColor: HairColor.BLACK,
      eyeColor: EyeColor.BLUE,
      eyeType: EyeType.NORMAL,
      clothing: ClothingStyle.CASUAL,
      environment: Environment.LIBRARY,
    },
    personality: {
      archetype: 'balanced',
      isCustom: false,
      traits: {
        submissiveDominant: 5,
        insecureConfident: 5,
        coldPassionate: 5,
        reservedOutgoing: 5,
        seriousPlayful: 5,
      },
      customSpecialty: '',
    },
    generation: {
      style: CharacterStyle.SPECIAL,
      model: null,
    },
    specialPrompt: '',
    specialNegativePrompt: '',
    persistentPrompt: '',
  });

  const handleSubmit = async () => {
    if (!draft.name?.trim()) {
      await dialog.alert({
        title: 'Name Required',
        message: 'Please enter a character name.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await characterAPI.createSpecialCharacter(draft as CharacterDraft);
      
      if (result.success) {
        await dialog.alert({
          title: 'Success!',
          message: 'Special character created successfully.',
        });
        router.push('/admin');
      } else {
        throw result.error || new Error('Failed to create character');
      }
    } catch (error) {
      console.error('Error creating special character:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to create special character. Only admins can create special characters.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDraft = (path: string, value: any) => {
    setDraft(prev => {
      const keys = path.split('.');
      if (keys.length === 1) {
        return { ...prev, [path]: value };
      }
      const [first, ...rest] = keys;
      return {
        ...prev,
        [first]: {
          ...(prev as any)[first],
          [rest.join('.')]: value,
        },
      };
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-400 font-medium">Admin Only</p>
                  <p className="text-sm text-dark-300">
                    Special characters are unique presets like monster girls, exotic species, 
                    and other fantasy characters that regular users cannot create.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Character Name *</label>
              <input
                type="text"
                value={draft.name || ''}
                onChange={(e) => updateDraft('name', e.target.value)}
                placeholder="e.g., Arachne, Lamia, Centaur..."
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Custom Specialty</label>
              <input
                type="text"
                value={draft.personality?.customSpecialty || ''}
                onChange={(e) => updateDraft('personality.customSpecialty', e.target.value)}
                placeholder="e.g., Spider lower body, Snake tail, Horse legs..."
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50"
              />
              <p className="text-xs text-dark-500 mt-1">
                Describe what makes this character special/exotic
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Age</label>
                <input
                  type="number"
                  value={draft.identity?.age || 25}
                  onChange={(e) => updateDraft('identity.age', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Ethnicity</label>
                <select
                  value={draft.identity?.ethnicity || ''}
                  onChange={(e) => updateDraft('identity.ethnicity', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(Ethnicity).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Height</label>
                <select
                  value={draft.body?.height || ''}
                  onChange={(e) => updateDraft('body.height', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(Height).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Physique</label>
                <select
                  value={draft.body?.physique || ''}
                  onChange={(e) => updateDraft('body.physique', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(Physique).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Hair Style</label>
                <select
                  value={draft.appearance?.hairStyle || ''}
                  onChange={(e) => updateDraft('appearance.hairStyle', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(HairStyle).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Hair Color</label>
                <select
                  value={draft.appearance?.hairColor || ''}
                  onChange={(e) => updateDraft('appearance.hairColor', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(HairColor).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Eye Color</label>
                <select
                  value={draft.appearance?.eyeColor || ''}
                  onChange={(e) => updateDraft('appearance.eyeColor', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(EyeColor).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Eye Type</label>
                <select
                  value={draft.appearance?.eyeType || ''}
                  onChange={(e) => updateDraft('appearance.eyeType', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(EyeType).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Default Clothing</label>
              <select
                value={draft.appearance?.clothing || ''}
                onChange={(e) => updateDraft('appearance.clothing', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              >
                {Object.entries(ClothingStyle).map(([key, value]) => (
                  <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Personality Archetype</label>
              <select
                value={draft.personality?.archetype || 'balanced'}
                onChange={(e) => updateDraft('personality.archetype', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="balanced">Balanced</option>
                <option value="tsundere">Tsundere</option>
                <option value="yandere">Yandere</option>
                <option value="kuudere">Kuudere</option>
                <option value="dandere">Dandere</option>
                <option value="deredere">Deredere</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-dark-300">Personality Traits (1-10)</p>
              
              {[
                { key: 'submissiveDominant', label: 'Submissive → Dominant' },
                { key: 'insecureConfident', label: 'Insecure → Confident' },
                { key: 'coldPassionate', label: 'Cold → Passionate' },
                { key: 'reservedOutgoing', label: 'Reserved → Outgoing' },
                { key: 'seriousPlayful', label: 'Serious → Playful' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-dark-400">{label}</span>
                    <span className="text-sm text-white">
                      {draft.personality?.traits?.[key as keyof typeof draft.personality.traits] || 5}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={draft.personality?.traits?.[key as keyof typeof draft.personality.traits] || 5}
                    onChange={(e) => updateDraft(`personality.traits.${key}`, parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Special Prompt</label>
              <textarea
                value={draft.specialPrompt || ''}
                onChange={(e) => updateDraft('specialPrompt', e.target.value)}
                placeholder="Enter custom prompt for this special character..."
                className="w-full h-32 px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
              <p className="text-xs text-dark-500 mt-1">
                Custom prompt that defines this special character's unique features
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Negative Prompt</label>
              <textarea
                value={draft.specialNegativePrompt || ''}
                onChange={(e) => updateDraft('specialNegativePrompt', e.target.value)}
                placeholder="Enter negative prompt..."
                className="w-full h-24 px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Persistent Prompt</label>
              <textarea
                value={draft.persistentPrompt || ''}
                onChange={(e) => updateDraft('persistentPrompt', e.target.value)}
                placeholder="Enter persistent prompt that always applies..."
                className="w-full h-24 px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">Important</p>
                  <p className="text-sm text-dark-300">
                    After creating this special character, you'll need to generate an image for it 
                    using the Special Characters section on the home page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Special Character</h1>
        </div>
        <p className="text-dark-400">
          Create a unique special character (monster girl, exotic species, etc.)
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentStep === index
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : currentStep > index
                  ? 'bg-green-500/10 text-green-400'
                  : 'text-dark-400'
              }`}
            >
              <step.icon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-dark-600 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="px-6 py-3 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors"
          >
            Previous
          </button>
        )}
        <div className="flex-1" />
        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Character
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
