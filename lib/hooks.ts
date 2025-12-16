import { useEffect, useState } from 'react';
import { useCharacterBuilder } from './store';
import { validateStep } from './validation';

export const useStepValidation = (step: number) => {
  const { draft } = useCharacterBuilder();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(validateStep(step, draft));
  }, [draft, step]);

  return isValid;
};

export const useCharacterPersistence = () => {
  const { draft, loadDraft } = useCharacterBuilder();
  const [isSaving, setIsSaving] = useState(false);

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('character-draft', JSON.stringify(draft));
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedDraft = () => {
    try {
      const saved = localStorage.getItem('character-draft');
      if (saved) {
        loadDraft(JSON.parse(saved));
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  };

  const clearSavedDraft = () => {
    try {
      localStorage.removeItem('character-draft');
      return true;
    } catch (error) {
      console.error('Failed to clear draft:', error);
      return false;
    }
  };

  return { saveDraft, loadSavedDraft, clearSavedDraft, isSaving };
};
