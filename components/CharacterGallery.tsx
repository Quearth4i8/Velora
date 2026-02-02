'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDimensionsFromAspectRatio, MODEL_DEFAULT_SETTINGS } from '@/config/aspect-ratios';
import { CharacterDraft, ChatMessage, CharacterImage } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';
import { characterAPI } from '@/lib/api';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { GenerationSettingsModal } from '@/components/ui/GenerationSettingsModal';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { useDialog } from '@/components/ui/DialogProvider';

interface CharacterGalleryProps {
  character: CharacterDraft;
  onBack: () => void;
  onCharacterUpdate: (updatedCharacter: CharacterDraft) => void;
}

export function CharacterGalleryComponent({ character, onBack, onCharacterUpdate }: CharacterGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterDraft>(character);
  const { blurNSFW, setBlurNSFW, toggleBlurNSFW } = useBlurNSFW();
  const dialog = useDialog();
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState<string | null>(null);
  const [showNavbarDropdown, setShowNavbarDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerationSettingsModal, setShowGenerationSettingsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sfw' | 'nsfw'>('all');

  // Sync editedCharacter when character prop changes
  useEffect(() => {
    setEditedCharacter(character);
  }, [character]);

  // Local generation settings
  const [generationSettings, setGenerationSettings] = useState<{
    steps: number;
    cfgScale: number;
    aspectRatio: string;
    sampler: string;
    seed: number;
    additionalTags?: string;
    isFuta: boolean;
    hiresFix: boolean;
    hiresScale: number;
    hiresUpscaler: string;
    hiresSteps: number;
    hiresDenoise: number;
  }>({
    steps: 30,
    cfgScale: 6,
    aspectRatio: 'portrait',
    sampler: 'Euler a',
    seed: -1,
    additionalTags: '',
    isFuta: false,
    hiresFix: false,
    hiresScale: 2,
    hiresUpscaler: 'Latent',
    hiresSteps: 0,
    hiresDenoise: 0.35
  });

  // Apply default model settings when model changes
  useEffect(() => {
    const model = editedCharacter.generation?.model;
    if (model && MODEL_DEFAULT_SETTINGS[model]) {
      setGenerationSettings(prev => ({
        ...prev,
        ...MODEL_DEFAULT_SETTINGS[model],
        additionalTags: prev.additionalTags || '',
        isFuta: prev.isFuta || false,
        hiresFix: prev.hiresFix || false,
        hiresScale: prev.hiresScale || 2,
        hiresUpscaler: prev.hiresUpscaler || 'Latent',
        hiresSteps: typeof prev.hiresSteps === 'number' ? prev.hiresSteps : 0,
        hiresDenoise: typeof prev.hiresDenoise === 'number' ? prev.hiresDenoise : 0.35
      }));
    }
  }, [editedCharacter.generation?.model]);

  // Function to detect if an image is NSFW based on generation prompt
  const isNSFWImage = useCallback((image: CharacterImage): boolean => {
    if (!image.generationPrompt) return false;

    const nsfwKeywords = ['naked', 'nude', 'lingerie', 'bikini', 'underwear', 'revealing', 'bodysuit'];
    const prompt = image.generationPrompt.toLowerCase();

    return nsfwKeywords.some(keyword => prompt.includes(keyword));
  }, []);

  const filteredImages = useMemo(() => {
    if (filter === 'all') return characterImages;
    return characterImages.filter((image) => {
      const nsfw = isNSFWImage(image);
      if (filter === 'sfw') return !nsfw;
      if (filter === 'nsfw') return nsfw;
      return true;
    });
  }, [characterImages, filter, isNSFWImage]);

  // Load character images from gallery
  useEffect(() => {
    if (character.id) {
      loadCharacterImages();
    }
  }, [character.id]);

  useEffect(() => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(0);
    }
  }, [filter]);

  useEffect(() => {
    if (filteredImages.length === 0 && isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(0);
      return;
    }

    if (zoomedImageIndex >= filteredImages.length && filteredImages.length > 0) {
      setZoomedImageIndex(0);
    }
  }, [filteredImages.length, isZoomed, zoomedImageIndex]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Close navbar dropdown if clicking outside
      if (showNavbarDropdown && !target.closest('.navbar-dropdown') && !target.closest('.navbar-dropdown-menu')) {
        setShowNavbarDropdown(false);
      }

      // Close image dropdowns if clicking outside
      if (showImageDropdown && !target.closest('.image-dropdown')) {
        setShowImageDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNavbarDropdown, showImageDropdown]);

  const loadCharacterImages = async () => {
    if (!character.id) return;

    try {
      const result = await characterAPI.getCharacterImages(character.id);
      if (result.success && result.data) {
        setCharacterImages(result.data);
      }
    } catch (error) {
      console.error('Failed to load character images:', error);
    }
  };

  const handleGenerateNewImage = async () => {
    if (!editedCharacter.generation?.style || !editedCharacter.generation?.model) {
      await dialog.alert({
        title: 'Missing settings',
        message: 'Character must have style and model selected to generate images',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await automatic1111API.generateCharacterImage(editedCharacter, generationSettings);

      // Reload images from gallery to get the new image
      await loadCharacterImages();

      // Update character generation status
      const updatedCharacter = {
        ...editedCharacter,
        generation: {
          ...editedCharacter.generation,
          generationStatus: 'completed' as const,
        }
      };

      setEditedCharacter(updatedCharacter);
      onCharacterUpdate(updatedCharacter);
    } catch (error) {
      console.error('Error generating new image:', error);
      setShowGenerationSettingsModal(false);
      await dialog.alert({ title: 'Error', message: 'Failed to generate new image. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCharacter = async () => {
    if (!character.id) return;

    try {
      const result = await characterAPI.updateCharacter(character.id, editedCharacter);
      if (result.success && result.data) {
        onCharacterUpdate(result.data);
        setEditedCharacter(result.data);
      } else {
        throw new Error('Failed to save character');
      }
    } catch (error) {
      console.error('Error saving character:', error);
      await dialog.alert({ title: 'Error', message: 'Failed to save character. Please try again.' });
    }
  };


  const handleImageClick = (index: number) => {
    if (index >= 0 && index < filteredImages.length) {
      setZoomedImageIndex(index);
      setIsZoomed(true);
    }
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  const handlePreviousImage = () => {
    setZoomedImageIndex((prev: number) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setZoomedImageIndex((prev: number) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  };

  const handleSetAsPrimary = async (imageId: string) => {
    if (!character.id) return;

    try {
      const result = await characterAPI.setPrimaryImage(character.id, imageId);
      if (result.success && result.data) {
        await loadCharacterImages(); // Reload to update UI

        // Update the character's generatedImage with the primary image URL
        const updatedCharacter = {
          ...character,
          generation: {
            ...character.generation,
            generatedImage: result.data.imageUrl
          }
        };
        onCharacterUpdate(updatedCharacter); // Update parent component
      } else {
        throw new Error('Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      await dialog.alert({ title: 'Error', message: 'Failed to set primary image. Please try again.' });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const ok = await dialog.confirm({
      title: 'Delete image?',
      message: 'Are you sure you want to delete this image?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    try {
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);
      if (result.success) {
        await loadCharacterImages(); // Reload to update UI
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
    }
  };

  const handleDeleteCharacter = async () => {
    const ok = await dialog.confirm({
      title: 'Delete Character?',
      message: `Are you sure you want to delete "${character.name || 'this character'}" and all their images? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    try {
      if (!character.id) {
        throw new Error('Character ID not found');
      }

      const result = await characterAPI.deleteCharacter(character.id);
      if (result.success) {
        // Navigate back to character list or main page
        // Navigate back to character list or main page
        window.location.href = '/';
      } else {
        throw new Error('Failed to delete character');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      await dialog.alert({ title: 'Error', message: 'Failed to delete character. Please try again.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedCharacter((prev: CharacterDraft) => {
      const updated = { ...prev };

      // Handle nested fields
      if (field.includes('.')) {
        const [category, subfield] = field.split('.');
        // Ensure parent object exists
        if (!(updated as any)[category]) {
          (updated as any)[category] = {};
        }
        (updated as any)[category] = {
          ...(updated as any)[category],
          [subfield]: field === 'identity.age' ? (parseInt(value) || null) : value
        };
      } else {
        (updated as any)[field] = value;
      }

      return updated;
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Dropdown Menu - Rendered at root level */}
      {showNavbarDropdown && (
        <div
          className="fixed bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-[9999] min-w-[120px] navbar-dropdown-menu"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
                setShowNavbarDropdown(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCharacter();
                setShowNavbarDropdown(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Gallery Header - Redesigned */}
      <div className="px-6 py-5 border-b border-dark-700/30 backdrop-blur-md bg-dark-900/50">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          {/* Left: Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800/50 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Center: Character Info - Responsive */}
          <div className="absolute left-1/2 -translate-x-1/2 flex-col items-center hidden sm:flex">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{character.name || 'Character'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
              <span className="text-xs sm:text-sm text-pink-400 capitalize font-medium">{character.mainTag || 'Human'}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800/50 transition-all duration-200"
              title="Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>

            <div className="relative navbar-dropdown">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    right: window.innerWidth - rect.right
                  });
                  setShowNavbarDropdown(!showNavbarDropdown);
                }}
                className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800/50 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Images Grid - Full Height */}
      <div className="h-[calc(100vh-120px)] overflow-hidden">
        {/* Filter Section - Enhanced */}
        <div className="px-6 py-6 border-b border-dark-700/20 backdrop-blur-md bg-dark-900/30">
          <div className="max-w-[2000px] mx-auto">
            {/* Filter Pills and Controls - Responsive Layout */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Filter Pills - Enhanced with Icons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`group relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${filter === 'all'
                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/40'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800/60 border border-dark-700/50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    All
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${filter === 'all' ? 'bg-white/20' : 'bg-dark-700'
                      }`}>
                      {characterImages.length}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => setFilter('sfw')}
                  className={`group relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${filter === 'sfw'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800/60 border border-dark-700/50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Safe
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${filter === 'sfw' ? 'bg-white/20' : 'bg-dark-700'
                      }`}>
                      {characterImages.filter(img => !isNSFWImage(img)).length}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => setFilter('nsfw')}
                  className={`group relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${filter === 'nsfw'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/40'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800/60 border border-dark-700/50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Adult
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${filter === 'nsfw' ? 'bg-white/20' : 'bg-dark-700'
                      }`}>
                      {characterImages.filter(img => isNSFWImage(img)).length}
                    </span>
                  </span>
                </button>

                {/* NSFW Blur Toggle - Mobile Responsive */}
                <div className="flex items-center gap-3 pl-3 border-l border-dark-700/50">
                  <span className="text-sm text-dark-400 whitespace-nowrap">Blur NSFW</span>
                  <button
                    onClick={toggleBlurNSFW}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${blurNSFW
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 shadow-lg shadow-pink-500/30'
                      : 'bg-dark-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${blurNSFW ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Generate Button - Full Width on Mobile */}
              <div className="relative group lg:ml-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-pink-400 to-pink-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                <button
                  onClick={() => setShowGenerationSettingsModal(true)}
                  disabled={isGenerating || !editedCharacter.generation?.style}
                  className="relative w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 text-white rounded-2xl text-sm font-bold hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 disabled:from-dark-700 disabled:via-dark-800 disabled:to-dark-700 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:scale-105 disabled:scale-100"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {characterImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-dark-800/50 rounded-full flex items-center justify-center mb-4 border border-dark-600/50">
              <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-200 mb-2">No Images Yet</h3>
            <p className="text-dark-400 mb-6">Generate your first image to start building the gallery</p>
            <PrimaryCTAButton
              label={isGenerating ? "Generating..." : "Generate First Image"}
              onClick={() => setShowGenerationSettingsModal(true)}
              disabled={isGenerating || !editedCharacter.generation?.style}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6 pb-24">
            <div className="masonry-grid max-w-[2000px] mx-auto">
              <AnimatePresence>
                {filteredImages
                  .map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="masonry-item group relative mb-6"
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-dark-700/30 bg-gradient-to-br from-dark-800/40 to-dark-900/40 cursor-pointer backdrop-blur-sm hover:border-pink-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10"
                        onClick={() => handleImageClick(index)}>
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/0 group-hover:from-pink-500/20 group-hover:via-pink-400/10 group-hover:to-pink-500/20 transition-all duration-500 pointer-events-none"></div>

                        <img
                          src={image.imageUrl}
                          alt={`Character image ${index + 1}`}
                          className={`w-full h-auto object-cover group-hover:scale-[1.02] transition-all duration-500 pointer-events-none ${isNSFWImage(image) && blurNSFW ? 'blur-lg' : ''
                            }`}
                          loading="lazy"
                        />

                        {/* NSFW Badge - Compact (Left) */}
                        {isNSFWImage(image) && (
                          <div className="absolute top-2 left-2 w-7 h-7 bg-red-600/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-red-500/30 group-hover:scale-110 transition-transform duration-200">
                            <span className="text-sm" title="NSFW Content">🔥</span>
                          </div>
                        )}
                        {/* 3-dot menu button (Right) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowImageDropdown(showImageDropdown === image.id ? null : image.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-dark-900/80 backdrop-blur-md rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-dark-800 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg border border-dark-700/50"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {showImageDropdown === image.id && (
                          <div className="absolute top-10 right-2 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-10 min-w-[120px] image-dropdown">
                            <div className="py-1">
                              {!image.isPrimary && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetAsPrimary(image.id);
                                    setShowImageDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                                >
                                  Set as Primary
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                  setShowImageDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex justify-between items-center">
                              <span className="text-white text-sm font-semibold backdrop-blur-sm bg-dark-900/40 px-3 py-1.5 rounded-lg">
                                #{index + 1}
                              </span>
                              {image.isPrimary && (
                                <span className="px-3 py-1.5 bg-gradient-to-r from-pink-600/90 to-pink-500/90 text-white rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            <style jsx>{`
              .masonry-grid {
                column-count: 1;
                column-gap: 1.5rem;
                width: 100%;
                column-fill: balance;
              }

              .masonry-item {
                break-inside: avoid;
                width: 100%;
                display: inline-block;
                vertical-align: top;
              }

              @media (min-width: 640px) {
                .masonry-grid {
                  column-count: 2;
                  column-gap: 1.5rem;
                }
              }

              @media (min-width: 768px) {
                .masonry-grid {
                  column-count: 3;
                  column-gap: 1.75rem;
                }
              }

              @media (min-width: 1024px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 2rem;
                }
              }

              @media (min-width: 1280px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 2rem;
                }
              }

              @media (min-width: 1536px) {
                .masonry-grid {
                  column-count: 5;
                  column-gap: 2.25rem;
                }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Edit Modal - Simplified Design */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative bg-dark-800 rounded-2xl border border-dark-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Simple */}
              <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Edit Character</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Simple */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="text-pink-400 text-sm font-medium block mb-2">Character Name</label>
                  <input
                    type="text"
                    value={editedCharacter.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700/50 text-white rounded-lg border border-dark-600 focus:border-pink-500 focus:outline-none transition-colors duration-200"
                    placeholder="Enter character name..."
                  />
                </div>

                <div>
                  <label className="text-pink-400 text-sm font-medium block mb-2">Age</label>
                  <input
                    type="number"
                    value={editedCharacter.identity?.age || ''}
                    onChange={(e) => handleInputChange('identity.age', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700/50 text-white rounded-lg border border-dark-600 focus:border-pink-500 focus:outline-none transition-colors duration-200"
                    placeholder="Enter age..."
                    min="0"
                    max="100"
                  />
                </div>

                <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/50">
                  <h4 className="text-sm font-medium text-pink-400 mb-3">Character Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Archetype:</span>
                      <span className="text-white capitalize">{editedCharacter.personality?.archetype || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Style:</span>
                      <span className="text-white capitalize">{editedCharacter.generation?.style || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Simple */}
              <div className="px-6 py-4 border-t border-dark-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-dark-700/50 text-pink-300 rounded-lg border border-pink-600/30 hover:bg-pink-600/20 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCharacter}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Settings Modal */}
      <GenerationSettingsModal
        isOpen={showGenerationSettingsModal}
        onClose={() => setShowGenerationSettingsModal(false)}
        settings={generationSettings}
        onSettingsChange={setGenerationSettings}
        onGenerate={handleGenerateNewImage}
        isGenerating={isGenerating}
        disabled={!editedCharacter.generation?.style}
        selectedModel={editedCharacter.generation?.model}
        characterId={character.id}
      />

      {/* Simple Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={handleCloseZoom}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative h-full flex items-center justify-center p-4"
            >
              <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={filteredImages[zoomedImageIndex]?.imageUrl}
                  alt={`Zoomed character image ${zoomedImageIndex + 1}`}
                  className={`max-w-full max-h-full object-contain rounded-lg ${filteredImages[zoomedImageIndex] && isNSFWImage(filteredImages[zoomedImageIndex]) && blurNSFW ? 'blur-lg' : ''
                    }`}
                />

                {/* Close Button */}

                {/* Navigation - Fixed positioning outside image */}
                {filteredImages.length > 1 && (
                  <>
                    <div className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviousImage();
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Image Counter */}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
