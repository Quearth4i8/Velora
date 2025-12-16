'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { characterAPI } from '@/lib/api';
import { StepProgressBar } from '@/components/ui/StepProgressBar';
import { Step1CoreIdentity } from '@/components/steps/Step1CoreIdentity';
import { Step2BodyProportions } from '@/components/steps/Step2BodyProportions';
import { Step3HairFace } from '@/components/steps/Step3HairFace';
import { Step4Personality } from '@/components/steps/Step4Personality';
import { Step5Confirmation } from '@/components/steps/Step5Confirmation';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Identity', 'Body', 'Appearance', 'Personality', 'Confirm'];

export default function CharacterCreator() {
  const { draft, setCurrentStep } = useCharacterBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    if (draft.currentStep < TOTAL_STEPS) {
      setCurrentStep(draft.currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (draft.currentStep > 1) {
      setCurrentStep(draft.currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await characterAPI.createCharacter(draft);
      if (result.success) {
        console.log('Character created successfully:', result.data);
        alert('Character created successfully!');
        setCurrentStep(1);
      } else {
        console.error('Failed to create character:', result.error);
        alert('Failed to create character. Please try again.');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      alert('An error occurred while creating the character.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (draft.currentStep) {
      case 1:
        return draft.identity.ageGroup && draft.identity.ethnicity;
      case 2:
        return (
          draft.body.height &&
          draft.body.physique &&
          draft.body.chestSize &&
          draft.body.buttSize
        );
      case 3:
        return (
          draft.appearance.hairStyle &&
          draft.appearance.hairColor &&
          draft.appearance.eyeColor
        );
      case 4:
        return draft.personality.archetype;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (draft.currentStep) {
      case 1:
        return <Step1CoreIdentity />;
      case 2:
        return <Step2BodyProportions />;
      case 3:
        return <Step3HairFace />;
      case 4:
        return <Step4Personality />;
      case 5:
        return <Step5Confirmation onConfirm={handleConfirm} isLoading={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
            <span className="gradient-text">Create Your Character</span>
          </h1>
          <p className="text-center text-dark-400 text-lg">
            Design your perfect AI companion with precision and style
          </p>
        </motion.div>

        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <StepProgressBar
            currentStep={draft.currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
          />
        </motion.div>

        <motion.div
          className="bg-dark-900/50 backdrop-blur-sm border border-dark-700 rounded-2xl p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={draft.currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="flex gap-4 mt-12 pt-8 border-t border-dark-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <button
              onClick={handlePreviousStep}
              disabled={draft.currentStep === 1}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                draft.currentStep === 1
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-600'
              }`}
            >
              Previous
            </button>

            {draft.currentStep < TOTAL_STEPS && (
              <PrimaryCTAButton
                label="Next Step"
                onClick={handleNextStep}
                disabled={!isStepValid()}
              />
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-8 text-center text-dark-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>Step {draft.currentStep} of {TOTAL_STEPS}</p>
        </motion.div>
      </div>
    </div>
  );
}
