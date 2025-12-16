'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterBuilder } from '@/lib/store';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { CharacterDraft } from '@/lib/types';
import { StepProgressBar } from '@/components/ui/StepProgressBar';
import { Step0CharacterName } from '@/components/steps/Step0CharacterName';
import { Step1CoreIdentity } from '@/components/steps/Step1CoreIdentity';
import { Step2BodyProportions } from '@/components/steps/Step2BodyProportions';
import { Step3HairFace } from '@/components/steps/Step3HairFace';
import { Step4BodyProportions } from '@/components/steps/Step4BodyProportions';
import { Step5Personality } from '@/components/steps/Step5Personality';
import { Step6ModelSelection } from '@/components/steps/Step6ModelSelection';
import { Step7Summary } from '@/components/steps/Step7Summary';
import { ChatInterface } from '@/components/ChatInterface';
import { Navbar } from '@/components/Navbar';
import { CharacterSelection } from '@/components/CharacterSelection';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { useRouter } from 'next/navigation';

const TOTAL_STEPS = 7;
const STEP_LABELS = ['Name & Age', 'Ethnicity & Skin', 'Appearance', 'Hair & Face', 'Personality', 'AI Model', 'Summary'];

export default function Home() {
  const { draft, setCurrentStep } = useCharacterBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [generatedCharacter, setGeneratedCharacter] = useState<CharacterDraft | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(true);
  const router = useRouter();

  const handleNextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }
    
    if (draft.currentStep < TOTAL_STEPS) {
      setCurrentStep(draft.currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (draft.currentStep > 0) {
      setCurrentStep(draft.currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToCreator = () => {
    setShowChat(false);
    setGeneratedCharacter(null);
  };

  const handleSelectCharacter = (character: CharacterDraft) => {
    // Navigate to character detail page
    if (character.id) {
      router.push(`/${character.id}`);
    }
  };

  const handleCreateNewCharacter = () => {
    setShowCharacterSelection(false);
    // Reset the character builder state
    setCurrentStep(0);
  };

  const handleBackToSelection = () => {
    setShowCharacterSelection(true);
    setShowChat(false);
    setGeneratedCharacter(null);
  };

  const validateCurrentStep = () => {
    switch (draft.currentStep) {
      case 0:
        // Step 1: Name & Age
        if (!draft.name?.trim()) {
          alert('Please enter a character name before proceeding.');
          return false;
        }
        if (!draft.identity.age || draft.identity.age < 18 || draft.identity.age > 100) {
          alert('Please enter a valid age between 18 and 100.');
          return false;
        }
        break;
      case 1:
        // Step 2: Ethnicity & Skin & Height
        if (!draft.identity.ethnicity) {
          alert('Please select an ethnic background before proceeding.');
          return false;
        }
        if (!draft.identity.skinTone) {
          alert('Please select a skin tone before proceeding.');
          return false;
        }
        if (!draft.body.height) {
          alert('Please select a height before proceeding.');
          return false;
        }
        break;
      case 2:
        // Step 3: Appearance (original Step3)
        if (!draft.appearance.hairStyle || !draft.appearance.hairColor || !draft.appearance.eyeColor) {
          alert('Please complete all appearance fields before proceeding.');
          return false;
        }
        break;
      case 3:
        // Step 4: Hair & Face (original Step4)
        if (!draft.body.physique || !draft.body.chestSize || !draft.body.buttSize) {
          alert('Please complete all body proportions before proceeding.');
          return false;
        }
        break;
      case 4:
        // Step 5: Personality (new Step5)
        if (!draft.personality.traits) {
          alert('Please set personality traits before proceeding.');
          return false;
        }
        break;
      case 5:
        // Step 6: AI Model (original Step6)
        if (!draft.generation?.style || !draft.generation?.model) {
          alert('Please select AI model and style before proceeding.');
          return false;
        }
        break;
      case 6:
        // Step 7: Summary - no validation needed
        break;
    }
    return true;
  };

  const handleConfirm = async () => {
    // This is now for Step 6 (Summary) confirmation - create character
    await handleGenerateCharacter();
  };

  const handleGenerateCharacter = async () => {
    // Debug: log the current draft
    console.log('Current draft:', draft);
    
    // Validate that draft exists and has all required properties
    if (!draft) {
      alert('Character draft is missing. Please start over.');
      return;
    }
    
    if (!draft.identity) {
      alert('Identity information is missing. Please complete Step 1.');
      return;
    }
    
    if (!draft.body) {
      alert('Body information is missing. Please complete Step 2.');
      return;
    }
    
    if (!draft.appearance) {
      alert('Appearance information is missing. Please complete Step 3.');
      return;
    }
    
    if (!draft.personality) {
      alert('Personality information is missing. Please complete Step 4.');
      return;
    }
    
    // Validate that all required fields are filled
    if (!draft.identity.age || !draft.identity.ethnicity) {
      alert('Please complete all identity fields before generating your character.');
      return;
    }
    
    if (!draft.body.height || !draft.body.physique || !draft.body.chestSize || !draft.body.buttSize) {
      alert('Please complete all body proportions before generating your character.');
      return;
    }
    
    if (!draft.appearance.hairStyle || !draft.appearance.hairColor || !draft.appearance.eyeColor) {
      alert('Please complete all appearance fields before generating your character.');
      return;
    }
    
    if (!draft.personality.traits) {
      alert('Please complete all personality fields before generating your character.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate the character using the API
      const result = await characterAPI.createCharacter(draft);
      
      if (result.success && result.data) {
        // Clear character list cache so new character appears
        localStorage.removeItem('characters_selection');
        localStorage.removeItem('characters_list_10');
        localStorage.removeItem('characters_list_50');
        
        setGeneratedCharacter(result.data);
        
        // Generate the character image
        if (draft.generation?.style && draft.generation?.model) {
          try {
            const imageUrl = await automatic1111API.generateCharacterImage(result.data);
            
            // Update character with generated image
            const updatedCharacter = {
              ...result.data,
              generation: {
                ...result.data.generation,
                generatedImage: imageUrl,
                generationStatus: 'completed' as const,
              }
            };
            
            // Update character with image
            await characterAPI.updateCharacter(result.data.id!, updatedCharacter);
            setGeneratedCharacter(updatedCharacter);
            
            // Navigate to character detail page
            router.push(`/${result.data.id}`);
          } catch (imageError) {
            console.error('Error generating image:', imageError);
            alert('Character created but image generation failed. You can generate images later.');
            router.push(`/${result.data.id}`);
          }
        } else {
          router.push(`/${result.data.id}`);
        }
      } else {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to create character');
      }
    } catch (error) {
      console.error('Error generating character:', error);
      alert(`Failed to create character: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showChat && generatedCharacter) {
    return <ChatInterface character={generatedCharacter} onBack={handleBackToSelection} />;
  }

  if (showCharacterSelection) {
    return (
      <CharacterSelection 
        onSelectCharacter={handleSelectCharacter}
        onCreateNew={handleCreateNewCharacter}
      />
    );
  }

  // Character creation flow
  const renderCurrentStep = () => {
    switch (draft.currentStep) {
      case 0:
        return <Step1CoreIdentity />; // Name & Age
      case 1:
        return <Step2BodyProportions />; // Ethnicity & Skin & Height
      case 2:
        return <Step3HairFace />; // Appearance (hair style, hair color, eye color)
      case 3:
        return <Step4BodyProportions />; // Hair & Face (physique, chest, butt)
      case 4:
        return <Step5Personality />; // Personality traits with sliders
      case 5:
        return <Step6ModelSelection onGenerate={handleNextStep} isLoading={isSubmitting} />; // AI Model
      case 6:
        return <Step7Summary onConfirm={handleConfirm} isLoading={isSubmitting} />; // Summary
      default:
        return <Step1CoreIdentity />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />
      
      {/* Progress Bar - only show during character creation */}
      {!showCharacterSelection && !showChat && (
        <div className="sticky top-16 z-40 bg-dark-900/80 backdrop-blur-sm border-b border-dark-800">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <StepProgressBar currentStep={draft.currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={draft.currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={handleBackToSelection}
            className="flex items-center text-dark-400 hover:text-dark-200 transition-colors group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Selection</span>
          </button>

          <div className="flex space-x-4">
            {draft.currentStep > 0 && (
              <button
                onClick={handlePreviousStep}
                className="px-6 py-3 bg-dark-800/50 text-dark-300 rounded-xl border border-dark-600/50 hover:bg-dark-700/50 transition-all duration-200"
              >
                Previous
              </button>
            )}

            {draft.currentStep < TOTAL_STEPS - 1 ? (
              <PrimaryCTAButton
                label="Next Step"
                onClick={handleNextStep}
                className="px-8"
              />
            ) : (
              <PrimaryCTAButton
                label={isSubmitting ? "Generating..." : "Generate Character"}
                onClick={handleGenerateCharacter}
                disabled={isSubmitting}
                className="px-8"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
