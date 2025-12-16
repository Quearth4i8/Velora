'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { validateStep } from '@/lib/validation';
import { StepProgressBar } from './ui/StepProgressBar';
import { Step1CoreIdentity } from './steps/Step1CoreIdentity';
import { Step2BodyProportions } from './steps/Step2BodyProportions';
import { Step3HairFace } from './steps/Step3HairFace';
import { Step4Personality } from './steps/Step4Personality';
import { Step5Confirmation } from './steps/Step5Confirmation';
import { PrimaryCTAButton } from './ui/PrimaryCTAButton';

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Identity', 'Body', 'Appearance', 'Personality', 'Confirm'];

interface CharacterBuilderProps {
  onCharacterCreated?: (characterId: string) => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({
  onCharacterCreated,
}) => {
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Character created:', draft);
      onCharacterCreated?.(draft.id || 'new-character');
    } catch (error) {
      console.error('Error creating character:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = validateStep(draft.currentStep, draft);

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
    <div className="w-full space-y-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <StepProgressBar
          currentStep={draft.currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
        />
      </motion.div>

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
        transition={{ delay: 0.3, duration: 0.3 }}
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
            disabled={!isStepValid}
          />
        )}
      </motion.div>
    </div>
  );
};
