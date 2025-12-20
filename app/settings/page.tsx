'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import {
  ButtSize,
  CharacterDraft,
  CharacterStyle,
  ChestSize,
  ClothingStyle,
  Environment,
  Ethnicity,
  EyeColor,
  EyeType,
  HairColor,
  HairStyle,
  Height,
  Physique,
} from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';

export default function SettingsPage() {
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();

  const [specialCharacters, setSpecialCharacters] = useState<CharacterDraft[]>([]);
  const [specialCharactersLoading, setSpecialCharactersLoading] = useState(false);
  const [specialCharactersError, setSpecialCharactersError] = useState<string | null>(null);

  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [specialModalMode, setSpecialModalMode] = useState<'create' | 'edit'>('create');
  const [editingSpecialCharacterId, setEditingSpecialCharacterId] = useState<string | null>(null);
  const [savingSpecialCharacter, setSavingSpecialCharacter] = useState(false);
  const [specialModalError, setSpecialModalError] = useState<string | null>(null);

  type SpecialCharacterFormState = {
    name: string;
    age: string;
    ethnicity: Ethnicity;
    style: CharacterStyle;
    mainTag: string;
    loraName: string;
    loraWeight: string;
    specialPrompt: string;
    specialNegativePrompt: string;
  };

  const getEmptySpecialCharacterForm = (): SpecialCharacterFormState => ({
    name: '',
    age: '22',
    ethnicity: Ethnicity.CAUCASIAN,
    style: CharacterStyle.ANIME,
    mainTag: '',
    loraName: '',
    loraWeight: '1',
    specialPrompt: '',
    specialNegativePrompt: '',
  });

  const [specialForm, setSpecialForm] = useState<SpecialCharacterFormState>(() => getEmptySpecialCharacterForm());

  const ethnicityOptions = useMemo(() => Object.values(Ethnicity) as Ethnicity[], []);
  const styleOptions = useMemo(() => Object.values(CharacterStyle) as CharacterStyle[], []);

  const invalidateCharacterCaches = (characterId?: string) => {
    try {
      if (typeof window === 'undefined') return;

      if (characterId) {
        localStorage.removeItem(`character_${characterId}`);
      }

      localStorage.removeItem('characters_list_10');
      localStorage.removeItem('characters_list_50');
      localStorage.removeItem('special_characters_list_10');
      localStorage.removeItem('special_characters_list_50');
    } catch {}
  };

  const loadSpecialCharacters = async () => {
    setSpecialCharactersError(null);
    setSpecialCharactersLoading(true);
    try {
      const result = await characterAPI.getSpecialCharacters();
      if (!result.success) {
        throw result.error instanceof Error ? result.error : new Error(String(result.error));
      }
      setSpecialCharacters(result.data || []);
    } catch (err) {
      setSpecialCharactersError(err instanceof Error ? err.message : 'Failed to load special characters');
    } finally {
      setSpecialCharactersLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialCharacters();
  }, []);

  const openCreateSpecialCharacter = () => {
    setSpecialModalMode('create');
    setEditingSpecialCharacterId(null);
    setSpecialForm(getEmptySpecialCharacterForm());
    setSpecialModalError(null);
    setSpecialModalOpen(true);
  };

  const openEditSpecialCharacter = (character: CharacterDraft) => {
    if (!character.id) return;

    setSpecialModalMode('edit');
    setEditingSpecialCharacterId(character.id);
    setSpecialForm({
      name: character.name || '',
      age: character.identity?.age ? String(character.identity.age) : '22',
      ethnicity: (character.identity?.ethnicity || Ethnicity.CAUCASIAN) as Ethnicity,
      style: (character.generation?.style || CharacterStyle.ANIME) as CharacterStyle,
      mainTag: character.mainTag || '',
      loraName: character.loraName || '',
      loraWeight:
        typeof character.loraWeight === 'number' && !Number.isNaN(character.loraWeight)
          ? String(character.loraWeight)
          : '',
      specialPrompt: character.specialPrompt || '',
      specialNegativePrompt: character.specialNegativePrompt || '',
    });
    setSpecialModalError(null);
    setSpecialModalOpen(true);
  };

  const closeSpecialModal = () => {
    if (savingSpecialCharacter) return;
    setSpecialModalOpen(false);
  };

  const handleSpecialStyleChange = (style: CharacterStyle) => {
    setSpecialForm((prev) => ({ ...prev, style }));
  };

  const buildSpecialCharacterDraft = (form: SpecialCharacterFormState): CharacterDraft => {
    const ageNumber = Number(form.age);
    const parsedWeight = form.loraWeight.trim() === '' ? null : Number(form.loraWeight);
    const loraWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;
    const resolvedModel = automatic1111API.getModelForStyle(form.style);

    return {
      currentStep: 7,
      name: form.name.trim(),
      characterType: 'special',
      mainTag: form.mainTag.trim() || undefined,
      loraName: form.loraName.trim() || undefined,
      loraWeight,
      specialPrompt: form.specialPrompt.trim() || undefined,
      specialNegativePrompt: form.specialNegativePrompt.trim() || undefined,
      identity: {
        age: ageNumber,
        ethnicity: form.ethnicity,
        skinTone: '#ffe0bd',
      },
      body: {
        height: Height.AVERAGE,
        physique: Physique.THICC,
        chestSize: ChestSize.AVERAGE,
        buttSize: ButtSize.AVERAGE,
      },
      appearance: {
        hairStyle: HairStyle.STRAIGHT,
        hairColor: HairColor.PINK,
        eyeColor: EyeColor.BROWN,
        eyeType: EyeType.NORMAL,
        clothing: ClothingStyle.CASUAL,
        environment: Environment.BEDROOM,
      },
      personality: {
        archetype: 'custom',
        isCustom: false,
        traits: {
          submissiveDominant: 50,
          insecureConfident: 50,
          coldPassionate: 50,
          reservedOutgoing: 50,
          seriousPlayful: 50,
        },
      },
      generation: {
        style: form.style,
        model: resolvedModel,
        generationStatus: 'pending',
      },
      isGalleryOnly: false,
    };
  };

  const saveSpecialCharacter = async () => {
    setSpecialModalError(null);

    const name = specialForm.name.trim();
    const ageNumber = Number(specialForm.age);

    if (!name) {
      setSpecialModalError('Name is required');
      return;
    }

    if (!specialForm.age.trim()) {
      setSpecialModalError('Age is required');
      return;
    }

    if (!Number.isFinite(ageNumber) || ageNumber < 0) {
      setSpecialModalError('Age must be 0+');
      return;
    }

    setSavingSpecialCharacter(true);
    try {
      if (specialModalMode === 'create') {
        const draft = buildSpecialCharacterDraft(specialForm);
        const result = await characterAPI.createCharacter(draft);
        if (!result.success) {
          throw result.error instanceof Error ? result.error : new Error(String(result.error));
        }
        invalidateCharacterCaches(result.data?.id);
        await loadSpecialCharacters();
        setSpecialModalOpen(false);
        return;
      }

      if (!editingSpecialCharacterId) {
        throw new Error('Missing character ID');
      }

      const parsedWeight = specialForm.loraWeight.trim() === '' ? null : Number(specialForm.loraWeight);
      const loraWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;
      const resolvedModel = automatic1111API.getModelForStyle(specialForm.style);

      const updateResult = await characterAPI.updateCharacterDirect(editingSpecialCharacterId, {
        name,
        age: ageNumber,
        ethnicity: specialForm.ethnicity,
        style: specialForm.style,
        model: resolvedModel,
        character_type: 'special',
        main_tag: specialForm.mainTag.trim() || null,
        lora_name: specialForm.loraName.trim() || null,
        lora_weight: loraWeight,
        special_prompt: specialForm.specialPrompt.trim() || null,
        special_negative_prompt: specialForm.specialNegativePrompt.trim() || null,
      });

      if (!updateResult.success) {
        throw updateResult.error instanceof Error ? updateResult.error : new Error(String(updateResult.error));
      }

      invalidateCharacterCaches(editingSpecialCharacterId);
      await loadSpecialCharacters();
      setSpecialModalOpen(false);
    } catch (err) {
      setSpecialModalError(err instanceof Error ? err.message : 'Failed to save special character');
    } finally {
      setSavingSpecialCharacter(false);
    }
  };

  const deleteSpecialCharacter = async (character: CharacterDraft) => {
    if (!character.id) return;

    const ok = window.confirm(`Delete ${character.name || 'this character'}? This cannot be undone.`);
    if (!ok) return;

    try {
      const result = await characterAPI.deleteCharacter(character.id);
      if (!result.success) {
        throw result.error instanceof Error ? result.error : new Error(String(result.error));
      }
      invalidateCharacterCaches(character.id);
      setSpecialCharacters((prev) => prev.filter((c) => c.id !== character.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete special character');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />
      
      <motion.div
        className="container mx-auto px-4 py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-300 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-dark-300">Manage your preferences and account settings</p>
          </div>

          {/* Settings Card */}
          <div className="relative overflow-hidden bg-dark-800/50 backdrop-blur-sm border border-pink-500/10 rounded-2xl p-6 shadow-2xl shadow-pink-500/5">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-pink-500/10 via-transparent to-fuchsia-500/10" />
            <div className="relative">
            {/* NSFW Content Settings */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Content Preferences</h2>
              
              <div className="bg-dark-900/50 border border-dark-700/80 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Blur NSFW Content</label>
                    <p className="text-dark-400 text-sm mt-1">
                      Automatically blur images with adult content in the gallery
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={toggleBlurNSFW}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      blurNSFW ? 'bg-pink-600 shadow-lg shadow-pink-500/30' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        blurNSFW ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-700/70 pt-6 mb-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Special Characters</h2>
                  <p className="text-dark-400 text-sm mt-1">Create and manage your special characters</p>
                </div>

                <button
                  onClick={openCreateSpecialCharacter}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-fuchsia-500 hover:from-pink-500 hover:to-fuchsia-400 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-pink-500/20"
                >
                  New
                </button>
              </div>

              {specialCharactersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size={32} />
                </div>
              ) : specialCharactersError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-300 text-sm">{specialCharactersError}</p>
                  <button
                    onClick={loadSpecialCharacters}
                    className="mt-3 text-sm text-pink-300 hover:text-pink-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : specialCharacters.length === 0 ? (
                <div className="bg-dark-900/50 border border-dark-700/80 rounded-xl p-4">
                  <p className="text-dark-400 text-sm">No special characters yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specialCharacters.map((char, index) => (
                    <div
                      key={char.id || `${char.name || 'special'}-${index}`}
                      className="bg-gradient-to-br from-dark-900/70 to-dark-800/40 border border-pink-500/10 hover:border-pink-500/25 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{char.name || 'Unnamed'}</p>
                          <p className="text-dark-400 text-sm mt-1 truncate">
                            {char.mainTag ? `Main tag: ${char.mainTag}` : 'Main tag: —'}
                          </p>
                          <p className="text-dark-500 text-xs mt-1 truncate">
                            {char.loraName
                              ? `LoRA: ${char.loraName}${
                                  char.loraWeight !== null && char.loraWeight !== undefined
                                    ? ` (${char.loraWeight})`
                                    : ''
                                }`
                              : 'LoRA: —'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditSpecialCharacter(char)}
                            className="px-3 py-1.5 bg-dark-900/40 hover:bg-dark-800/60 text-pink-100 text-sm rounded-lg border border-pink-500/15 hover:border-pink-500/25 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSpecialCharacter(char)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm rounded-lg border border-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {char.id && (
                        <div className="mt-3 flex items-center gap-4">
                          <Link
                            href={`/special/${char.id}`}
                            className="inline-flex items-center px-3 py-1 bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 rounded-full text-sm text-pink-200 transition-colors"
                          >
                            Open Chat
                          </Link>
                          <Link
                            href={`/special/${char.id}/gallery`}
                            className="inline-flex items-center px-3 py-1 bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 rounded-full text-sm text-pink-200 transition-colors"
                          >
                            Gallery
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Settings (Placeholder) */}
            <div className="border-t border-dark-700 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="text-dark-400">
                  <p>More settings coming soon...</p>
                  <p className="text-sm mt-2">• Profile customization</p>
                  <p className="text-sm">• Privacy controls</p>
                  <p className="text-sm">• Notification preferences</p>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Save Status */}
          <motion.div
            className="mt-6 text-center text-pink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Settings are saved automatically
          </motion.div>
        </div>
      </motion.div>

      <Modal
        isOpen={specialModalOpen}
        onClose={closeSpecialModal}
        title={specialModalMode === 'create' ? 'Create Special Character' : 'Edit Special Character'}
        size="lg"
      >
        <div className="space-y-4">
          {specialModalError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300 text-sm">{specialModalError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Name</label>
              <input
                value={specialForm.name}
                onChange={(e) => setSpecialForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={savingSpecialCharacter}
                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="e.g. Velora"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Age</label>
                <input
                  type="number"
                  min={0}
                  value={specialForm.age}
                  onChange={(e) => setSpecialForm((prev) => ({ ...prev, age: e.target.value }))}
                  disabled={savingSpecialCharacter}
                  className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Ethnicity</label>
                <select
                  value={specialForm.ethnicity}
                  onChange={(e) =>
                    setSpecialForm((prev) => ({ ...prev, ethnicity: e.target.value as Ethnicity }))
                  }
                  disabled={savingSpecialCharacter}
                  className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                >
                  {ethnicityOptions.map((eth) => (
                    <option key={eth} value={eth}>
                      {eth}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Style</label>
                <select
                  value={specialForm.style}
                  onChange={(e) => handleSpecialStyleChange(e.target.value as CharacterStyle)}
                  disabled={savingSpecialCharacter}
                  className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                >
                  {styleOptions.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Main Tag</label>
              <input
                value={specialForm.mainTag}
                onChange={(e) => setSpecialForm((prev) => ({ ...prev, mainTag: e.target.value }))}
                disabled={savingSpecialCharacter}
                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="e.g. (character name tag)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-dark-300 mb-1">LoRA Name</label>
                <input
                  value={specialForm.loraName}
                  onChange={(e) => setSpecialForm((prev) => ({ ...prev, loraName: e.target.value }))}
                  disabled={savingSpecialCharacter}
                  className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  placeholder="e.g. my_lora"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Weight</label>
                <input
                  type="number"
                  step="0.05"
                  value={specialForm.loraWeight}
                  onChange={(e) => setSpecialForm((prev) => ({ ...prev, loraWeight: e.target.value }))}
                  disabled={savingSpecialCharacter}
                  className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Special Prompt</label>
              <textarea
                value={specialForm.specialPrompt}
                onChange={(e) => setSpecialForm((prev) => ({ ...prev, specialPrompt: e.target.value }))}
                disabled={savingSpecialCharacter}
                rows={3}
                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
                placeholder="Extra prompt injected for this special character"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Special Negative Prompt</label>
              <textarea
                value={specialForm.specialNegativePrompt}
                onChange={(e) => setSpecialForm((prev) => ({ ...prev, specialNegativePrompt: e.target.value }))}
                disabled={savingSpecialCharacter}
                rows={2}
                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
                placeholder="Extra negative prompt injected for this character"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={closeSpecialModal}
              disabled={savingSpecialCharacter}
              className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg border border-dark-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={saveSpecialCharacter}
              disabled={savingSpecialCharacter}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {savingSpecialCharacter ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size={18} color="text-white" />
                  Saving...
                </span>
              ) : specialModalMode === 'create' ? (
                'Create'
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
