'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
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
import { useDialog } from '@/components/ui/DialogProvider';

export default function ManageCharactersPage() {
    const dialog = useDialog();

    const [specialCharacters, setSpecialCharacters] = useState<CharacterDraft[]>([]);
    const [filteredSpecialCharacters, setFilteredSpecialCharacters] = useState<CharacterDraft[]>([]);
    const [specialCharSearch, setSpecialCharSearch] = useState('');
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
        heat: string;
        ethnicity: Ethnicity;
        style: CharacterStyle;
        mainTag: string;
        loraName: string;
        loraWeight: string;
        specialPrompt: string;
        specialNegativePrompt: string;
        customSpecialty: string;
    };

    const getEmptySpecialCharacterForm = (): SpecialCharacterFormState => ({
        name: '',
        age: '22',
        heat: '25',
        ethnicity: Ethnicity.EAST_ASIAN,
        style: CharacterStyle.ANIME,
        mainTag: '',
        loraName: '',
        loraWeight: '1',
        specialPrompt: '',
        specialNegativePrompt: '',
        customSpecialty: '',
    });

    const [specialForm, setSpecialForm] = useState<SpecialCharacterFormState>(() => getEmptySpecialCharacterForm());

    const ethnicityOptions = useMemo(() => Object.values(Ethnicity) as Ethnicity[], []);
    const styleOptions = useMemo(() => Object.values(CharacterStyle) as CharacterStyle[], []);

    const ethnicityLabelMap: Record<Ethnicity, string> = {
        [Ethnicity.EAST_ASIAN]: 'East Asian',
        [Ethnicity.KOREAN]: 'Korean',
        [Ethnicity.JAPANESE]: 'Japanese',
        [Ethnicity.BRAZILIAN]: 'Brazilian',
        [Ethnicity.COLOMBIAN]: 'Colombian',
        [Ethnicity.LATIN_AMERICAN]: 'Latin American',
        [Ethnicity.RUSSIAN]: 'Russian',
        [Ethnicity.UKRAINIAN]: 'Ukrainian',
        [Ethnicity.SCANDINAVIAN]: 'Scandinavian',
        [Ethnicity.ITALIAN]: 'Italian',
        [Ethnicity.LEBANESE]: 'Lebanese',
        [Ethnicity.MIXED_EXOTIC]: 'Mixed Exotic',
    };

    const styleLabelMap: Record<CharacterStyle, string> = {
        [CharacterStyle.ANIME]: 'Anime',
        [CharacterStyle.ANIME_ILLUSTRIOUS]: 'Anime Illustrative',
        [CharacterStyle.MOE_FUSSION]: 'Moe Fussion',
        [CharacterStyle.REALISTIC]: 'Realistic',
        [CharacterStyle.ARTISTIC]: 'Artistic',
        [CharacterStyle.SPECIAL]: 'Special',
    };

    const styleLabelWithModel = (style: CharacterStyle): string => {
        const label = styleLabelMap[style] || style;
        const model = automatic1111API.getModelForStyle(style);
        return `${label} (${model})`;
    };

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
        } catch { }
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

    useEffect(() => {
        if (!specialCharSearch.trim()) {
            setFilteredSpecialCharacters(specialCharacters);
            return;
        }
        const query = specialCharSearch.toLowerCase();
        const filtered = specialCharacters.filter(
            (char) =>
                (char.name && char.name.toLowerCase().includes(query)) ||
                (char.mainTag && char.mainTag.toLowerCase().includes(query)) ||
                (char.loraName && char.loraName.toLowerCase().includes(query))
        );
        setFilteredSpecialCharacters(filtered);
    }, [specialCharacters, specialCharSearch]);

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
            heat: typeof character.heat === 'number' && Number.isFinite(character.heat) ? String(character.heat) : '25',
            ethnicity: (character.identity?.ethnicity || Ethnicity.EAST_ASIAN) as Ethnicity,
            style: (character.generation?.style || CharacterStyle.ANIME) as CharacterStyle,
            mainTag: character.mainTag || '',
            loraName: character.loraName || '',
            loraWeight:
                typeof character.loraWeight === 'number' && !Number.isNaN(character.loraWeight)
                    ? String(character.loraWeight)
                    : '',
            specialPrompt: character.specialPrompt || '',
            specialNegativePrompt: character.specialNegativePrompt || '',
            customSpecialty: character.personality?.customSpecialty || '',
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
        const heatNumber = form.heat.trim() === '' ? 25 : Number(form.heat);
        const heat = Number.isFinite(heatNumber) ? Math.min(100, Math.max(0, Math.round(heatNumber))) : 25;
        const parsedWeight = form.loraWeight.trim() === '' ? null : Number(form.loraWeight);
        const loraWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;
        const resolvedModel = automatic1111API.getModelForStyle(form.style);

        return {
            currentStep: 7,
            name: form.name.trim(),
            characterType: 'special',
            heat,
            mainTag: form.mainTag.trim() || undefined,
            loraName: form.loraName.trim() || undefined,
            loraWeight,
            specialPrompt: form.specialPrompt.trim() || undefined,
            specialNegativePrompt: form.specialNegativePrompt.trim() || undefined,
            identity: {
                age: ageNumber,
                ethnicity: form.ethnicity,
                skinTone: undefined,
            },
            body: {
                height: null,
                physique: null,
                chestSize: null,
                buttSize: null,
            },
            appearance: {
                hairStyle: null,
                hairColor: null,
                eyeColor: null,
                eyeType: null,
                clothing: null,
                environment: null,
            },
            personality: {
                archetype: 'custom',
                isCustom: true,
                traits: {
                    submissiveDominant: 50,
                    insecureConfident: 50,
                    coldPassionate: 50,
                    reservedOutgoing: 50,
                    seriousPlayful: 50,
                },
                customSpecialty: form.customSpecialty.trim() || undefined,
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
        const heatNumber = specialForm.heat.trim() === '' ? 25 : Number(specialForm.heat);
        const heat = Number.isFinite(heatNumber) ? Math.min(100, Math.max(0, Math.round(heatNumber))) : 25;

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

        if (!Number.isFinite(heatNumber) || heat < 0 || heat > 100) {
            setSpecialModalError('Heat must be between 0 and 100');
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
                heat,
                ethnicity: specialForm.ethnicity,
                style: specialForm.style,
                model: resolvedModel,
                character_type: 'special',
                main_tag: specialForm.mainTag.trim() || null,
                lora_name: specialForm.loraName.trim() || null,
                lora_weight: loraWeight,
                special_prompt: specialForm.specialPrompt.trim() || null,
                special_negative_prompt: specialForm.specialNegativePrompt.trim() || null,
                personality_traits: {
                    submissiveDominant: 50,
                    insecureConfident: 50,
                    coldPassionate: 50,
                    reservedOutgoing: 50,
                    seriousPlayful: 50,
                    customSpecialty: specialForm.customSpecialty.trim() || null,
                },
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

        const ok = await dialog.confirm({
            title: 'Delete character?',
            message: `Delete ${character.name || 'this character'}? This cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            destructive: true,
        });

        if (!ok) return;

        try {
            const result = await characterAPI.deleteCharacter(character.id);
            if (!result.success) {
                throw result.error instanceof Error ? result.error : new Error(String(result.error));
            }
            invalidateCharacterCaches(character.id);
            setSpecialCharacters((prev) => prev.filter((c) => c.id !== character.id));
        } catch (err) {
            await dialog.alert({
                title: 'Error',
                message: err instanceof Error ? err.message : 'Failed to delete special character',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
            <Navbar />

            <motion.div
                className="container mx-auto px-4 py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-300 via-pink-400 to-pink-500 bg-clip-text text-transparent">
                                Manage Characters
                            </h1>
                            <p className="text-dark-300 mt-2">Create, edit, and manage your special character collection</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    value={specialCharSearch}
                                    onChange={(e) => setSpecialCharSearch(e.target.value)}
                                    placeholder="Search characters..."
                                    className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none shadow-sm placeholder-dark-500 transition-all font-medium"
                                />
                                <svg
                                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-dark-500 w-5 h-5 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <button
                                onClick={openCreateSpecialCharacter}
                                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 whitespace-nowrap transform hover:scale-105"
                            >
                                + New Character
                            </button>
                        </div>
                    </div>

                    {/* Character Grid */}
                    {specialCharactersLoading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size={48} />
                        </div>
                    ) : specialCharactersError ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                            <p className="text-red-300 mb-4 text-lg">{specialCharactersError}</p>
                            <button
                                onClick={loadSpecialCharacters}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition-colors font-medium"
                            >
                                Retry Loading
                            </button>
                        </div>
                    ) : specialCharacters.length === 0 ? (
                        <div className="bg-dark-900/50 border border-dark-800 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No characters yet</h3>
                            <p className="text-dark-400 mb-6 max-w-md mx-auto">
                                Get started by creating your first special character. You can define custom appearances, prompts, and LoRAs.
                            </p>
                            <button
                                onClick={openCreateSpecialCharacter}
                                className="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-xl transition-colors border border-dark-700"
                            >
                                Create Character
                            </button>
                        </div>
                    ) : (
                        <>
                            {filteredSpecialCharacters.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                    {filteredSpecialCharacters.map((char, index) => (
                                        <motion.div
                                            key={char.id || `${char.name || 'special'}-${index}`}
                                            layoutId={char.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="group bg-dark-800/40 hover:bg-dark-800/80 border border-dark-700 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/5 flex flex-col h-full"
                                        >
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-lg font-bold text-white truncate pr-2 group-hover:text-pink-300 transition-colors">
                                                        {char.name || 'Unnamed'}
                                                    </h3>
                                                    <span className="shrink-0 px-2 py-1 bg-dark-950/50 rounded-md text-xs font-medium text-dark-400 border border-dark-800">
                                                        {char.generation?.style === CharacterStyle.SPECIAL ? 'Special' : char.generation?.style || 'N/A'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 mb-4 flex-1">
                                                    <div className="bg-dark-950/30 rounded-lg p-2.5 border border-dark-800/50">
                                                        <p className="text-xs text-dark-500 uppercase tracking-wider mb-1 font-semibold">Main Tag</p>
                                                        <p className="text-sm text-dark-200 truncate font-mono">
                                                            {char.mainTag || <span className="text-dark-600 italic">None</span>}
                                                        </p>
                                                    </div>

                                                    <div className="bg-dark-950/30 rounded-lg p-2.5 border border-dark-800/50">
                                                        <p className="text-xs text-dark-500 uppercase tracking-wider mb-1 font-semibold">LoRA Model</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm text-dark-200 truncate font-mono flex-1 mr-2">
                                                                {char.loraName || <span className="text-dark-600 italic">None</span>}
                                                            </p>
                                                            {char.loraName && (
                                                                <span className="text-xs bg-pink-500/10 text-pink-300 px-1.5 py-0.5 rounded">
                                                                    {char.loraWeight ?? 1.0}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-4 border-t border-dark-700/50 mt-auto">
                                                    {char.id && (
                                                        <Link
                                                            href={`/special/${char.id}`}
                                                            className="flex-1 text-center py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-sm font-medium rounded-lg transition-colors border border-pink-500/20"
                                                        >
                                                            Chat
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => openEditSpecialCharacter(char)}
                                                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSpecialCharacter(char)}
                                                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 bg-dark-800/50 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-white mb-2">No matches found</h3>
                                    <p className="text-dark-400">
                                        We couldn't find any characters matching "{specialCharSearch}"
                                    </p>
                                    <button
                                        onClick={() => setSpecialCharSearch('')}
                                        className="mt-4 text-pink-400 hover:text-pink-300 font-medium"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Save Status */}
                    <motion.div
                        className="mt-12 text-center text-dark-500 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Manage your character repository • Changes are saved automatically
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
                                            {ethnicityLabelMap[eth] || eth}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Heat (0-100)</label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={specialForm.heat}
                                onChange={(e) => setSpecialForm((prev) => ({ ...prev, heat: e.target.value }))}
                                disabled={savingSpecialCharacter}
                                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                            />
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
                                            {styleLabelWithModel(style)}
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

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Custom Specialty</label>
                            <input
                                value={specialForm.customSpecialty}
                                onChange={(e) => setSpecialForm((prev) => ({ ...prev, customSpecialty: e.target.value }))}
                                disabled={savingSpecialCharacter}
                                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                                placeholder="e.g., Seductive Charmer, Playful Trickster, Mystical Healer..."
                            />
                            <p className="text-xs text-dark-500 mt-1">
                                Define what makes this character unique and special
                            </p>
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
