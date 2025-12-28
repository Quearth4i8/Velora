'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCharacterBuilder } from '@/lib/store';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

// Import all step components
import { Step0NameAge } from './steps/Step0NameAge';
import { Step1ImageStyle } from './steps/Step1ImageStyle';
import { Step2BodyProportions } from './steps/Step2BodyProportions';
import { Step3HairFace } from './steps/Step3HairFace';
import { Step4BodyProportions } from './steps/Step4BodyProportions';
import { Step5Personality } from './steps/Step5Personality';
import { Step6Confirmation } from './steps/Step6Confirmation';

export function CharacterBuilder() {
  const { draft, setCurrentStep, resetDraft } = useCharacterBuilder();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = 7;
  const currentStep = draft.currentStep || 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!draft.generation?.style) {
      setError('Please select an image style before generating.');
      return;
    }

    const resolvedModel = draft.generation.model || automatic1111API.getModelForStyle(draft.generation.style);
    const resolvedDraft = draft.generation.model
      ? draft
      : {
        ...draft,
        generation: {
          ...draft.generation,
          model: resolvedModel,
        },
      };

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Starting character creation with draft:', draft);

      // First create the character in the database
      const createResult = await characterAPI.createCharacter(resolvedDraft);
      if (!createResult.success || !createResult.data) {
        console.error('Character creation failed:', createResult.error);
        throw new Error('Failed to create character');
      }

      console.log('Character created successfully:', createResult.data);

      // Update draft with character ID
      const characterWithId = {
        ...resolvedDraft,
        id: createResult.data.id,
      };

      // Generate the character image
      console.log('Starting image generation...');
      const imageUrl = await automatic1111API.generateCharacterImage(characterWithId);
      console.log('Image generated successfully:', imageUrl);

      // Navigate to the chat interface
      console.log('Navigating to chat page...');
      router.push(`/${createResult.data.id}`);
    } catch (error) {
      console.error('Error generating character:', error);
      setError(`Failed to generate character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0NameAge />;
      case 1:
        return <Step1ImageStyle />;
      case 2:
        return <Step2BodyProportions />;
      case 3:
        return <Step3HairFace />;
      case 4:
        return <Step4BodyProportions />;
      case 5:
        return <Step5Personality />;
      case 6:
        return <Step6Confirmation />;
      default:
        return <Step0NameAge />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Name & Age';
      case 1:
        return 'Image Style';
      case 2:
        return 'Background & Height';
      case 3:
        return 'Hair, Eyes & Style';
      case 4:
        return 'Body Shape';
      case 5:
        return 'Personality';
      case 6:
        return 'Review & Generate';
      default:
        return 'Character Creation';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0:
        return "Give your character a name and set their age";
      case 1:
        return 'Choose anime, realistic, or artistic style';
      case 2:
        return "Choose ethnicity, skin tone, and height";
      case 3:
        return "Pick hair, eyes, and a default clothing style";
      case 4:
        return 'Select physique, chest size, and butt size';
      case 5:
        return 'Set personality traits and character archetype';
      case 6:
        return 'Review your character details, then generate';
      default:
        return 'Create your AI companion';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return Boolean(draft.name?.trim()) && typeof draft.identity.age === 'number';
      case 1:
        return Boolean(draft.generation?.style);
      case 2:
        return Boolean(draft.identity.ethnicity) && Boolean(draft.body.height) && Boolean(draft.identity.skinTone);
      case 3:
        return (
          Boolean(draft.appearance.hairStyle) &&
          Boolean(draft.appearance.hairColor) &&
          Boolean(draft.appearance.eyeColor) &&
          Boolean(draft.appearance.eyeType) &&
          Boolean(draft.appearance.clothing)
        );
      case 4:
        return Boolean(draft.body.physique) && Boolean(draft.body.chestSize) && Boolean(draft.body.buttSize);
      case 5:
        return Boolean(draft.personality.archetype);
      case 6:
        return true; // Confirmation step doesn't require additional validation
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 via-pink-400 to-pink-500 bg-clip-text text-transparent">
            {getStepTitle()}
          </h2>
          <span className="text-dark-400 text-sm">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        <div className="w-full bg-dark-900/60 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-pink-600 to-pink-500 h-2 rounded-full"
            initial={{ width: `${((currentStep) / totalSteps) * 100}%` }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        <p className="text-dark-400 text-sm mt-2">{getStepDescription()}</p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Step Content */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-pink-500/10 bg-dark-800/40 backdrop-blur-sm p-6 shadow-2xl shadow-pink-500/5">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-pink-500/10 via-transparent to-pink-500/10" />
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentStep > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              className="px-6 py-3 bg-dark-900/40 text-white rounded-xl border border-pink-500/15 hover:border-pink-500/25 hover:bg-dark-800/60 transition-all duration-200"
            >
              Previous
            </motion.button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {currentStep < totalSteps - 1 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${canProceed()
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-400 shadow-lg shadow-pink-500/20'
                  : 'bg-dark-800 text-dark-400 cursor-not-allowed'
                }`}
            >
              Next
            </motion.button>
          ) : (
            <PrimaryCTAButton
              label={isGenerating ? 'Generating...' : 'Generate Character'}
              onClick={handleGenerate}
              disabled={!canProceed() || isGenerating}
              loading={isGenerating}
              className="px-8 py-3"
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-8 border-t border-dark-700/60">
        <div className="flex items-center justify-between">
          <div className="text-dark-400 text-sm">
            Want to start over?{' '}
            <button
              onClick={() => {
                resetDraft();
                setError(null);
              }}
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              Reset Character
            </button>
          </div>

          <div className="text-dark-400 text-sm">
            Already have a character?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
