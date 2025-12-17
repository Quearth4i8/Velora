'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCharacterBuilder } from '@/lib/store';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

// Import all step components
import { Step1CoreIdentity } from './steps/Step1CoreIdentity';
import { Step2BodyProportions } from './steps/Step2BodyProportions';
import { Step3HairFace } from './steps/Step3HairFace';
import { Step4BodyProportions } from './steps/Step4BodyProportions';
import { Step4Personality } from './steps/Step4Personality';
import { Step5Confirmation } from './steps/Step5Confirmation';
import { Step6Generation } from './steps/Step6Generation';

export function CharacterBuilder() {
  const { draft, setCurrentStep, resetDraft } = useCharacterBuilder();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = 7;
  const currentStep = draft.currentStep || 0;

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
    if (!draft.generation?.style || !draft.generation?.model) {
      setError('Please select a style and model before generating.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Starting character creation with draft:', draft);
      
      // First create the character in the database
      const createResult = await characterAPI.createCharacter(draft);
      if (!createResult.success || !createResult.data) {
        console.error('Character creation failed:', createResult.error);
        throw new Error('Failed to create character');
      }

      console.log('Character created successfully:', createResult.data);

      // Update draft with character ID
      const characterWithId = {
        ...draft,
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
        return <Step1CoreIdentity />;
      case 1:
        return <Step2BodyProportions />;
      case 2:
        return <Step3HairFace />;
      case 3:
        return <Step4BodyProportions />;
      case 4:
        return <Step4Personality />;
      case 5:
        return <Step6Generation />;
      case 6:
        return <Step5Confirmation onConfirm={handleGenerate} isLoading={isGenerating} />;
      default:
        return <Step1CoreIdentity />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Core Identity';
      case 1:
        return 'Body Proportions';
      case 2:
        return 'Hair & Face';
      case 3:
        return 'Body Shape';
      case 4:
        return 'Personality';
      case 5:
        return 'Generation Settings';
      case 6:
        return 'Confirmation';
      default:
        return 'Character Creation';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0:
        return 'Set the basic identity and name for your character';
      case 1:
        return 'Define body type, height, and physical proportions';
      case 2:
        return 'Choose hair style, color, eyes, and facial features';
      case 3:
        return 'Select physique, chest size, and butt size';
      case 4:
        return 'Set personality traits and character archetype';
      case 5:
        return 'Choose image style and AI model for generation';
      case 6:
        return 'Review your character and generate the image';
      default:
        return 'Create your AI companion';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return draft.name && draft.identity.age;
      case 1:
        return draft.identity.ethnicity && draft.body.height && draft.identity.skinTone;
      case 2:
        return draft.appearance.hairStyle && draft.appearance.hairColor && 
               draft.appearance.eyeColor && draft.appearance.eyeType;
      case 3:
        return draft.body.physique && draft.body.chestSize && draft.body.buttSize;
      case 4:
        return draft.personality.archetype;
      case 5:
        return draft.generation?.style && draft.generation?.model;
      case 6:
        return true; // Confirmation step doesn't require additional validation
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{getStepTitle()}</h2>
          <span className="text-dark-400 text-sm">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-dark-800 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full"
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

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentStep > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              className="px-6 py-3 bg-dark-800 text-white rounded-xl border border-dark-600 hover:bg-dark-700 transition-all duration-200"
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
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                canProceed()
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/20'
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
      <div className="mt-8 pt-8 border-t border-dark-800">
        <div className="flex items-center justify-between">
          <div className="text-dark-400 text-sm">
            Want to start over?{' '}
            <button
              onClick={() => {
                resetDraft();
                setError(null);
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Reset Character
            </button>
          </div>
          
          <div className="text-dark-400 text-sm">
            Already have a character?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
