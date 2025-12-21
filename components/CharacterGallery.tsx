'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, CharacterImage } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';
import { characterAPI } from '@/lib/api';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { GenerationSettingsModal } from '@/components/ui/GenerationSettingsModal';
import { useBlurNSFW } from '@/lib/useBlurNSFW';

interface CharacterGalleryProps {
  character: CharacterDraft;
  onBack: () => void;
  onCharacterUpdate: (updatedCharacter: CharacterDraft) => void;
}

export function CharacterGalleryComponent({ character, onBack, onCharacterUpdate }: CharacterGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterDraft>(character);
  const { blurNSFW, setBlurNSFW, toggleBlurNSFW } = useBlurNSFW();
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState<string | null>(null);
  const [showNavbarDropdown, setShowNavbarDropdown] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerationSettingsModal, setShowGenerationSettingsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sfw' | 'nsfw'>('all');
  
  // Local generation settings
  const [generationSettings, setGenerationSettings] = useState({
    steps: 30,
    cfgScale: 8,
    aspectRatio: 'portrait',
    sampler: 'DPM++ 2M Karras',
    seed: -1
  });

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
      const target = event.target as Element;
      
      // Close navbar dropdown if clicking outside
      if (showNavbarDropdown && !target.closest('.navbar-dropdown')) {
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
      alert('Character must have style and model selected to generate images');
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
      alert('Failed to generate new image. Please try again.');
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
      alert('Failed to save character. Please try again.');
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
      alert('Failed to set primary image. Please try again.');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);
      if (result.success) {
        await loadCharacterImages(); // Reload to update UI
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedCharacter((prev: CharacterDraft) => {
      const updated = { ...prev };
      
      // Handle nested fields
      if (field.includes('.')) {
        const [category, subfield] = field.split('.');
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
      {/* Gallery Header */}
      <div className="px-8 py-6 border-b border-dark-700/50 backdrop-blur-sm">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-pink-300 hover:text-pink-200 transition-colors group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
          
          {/* Character Name - Center */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-3">              
              {/* Character Info */}
              <div className="flex flex-col items-center">
                <h1 className="text-xl font-semibold text-white">{character.name || 'Character'}</h1>
                <div className="text-sm text-pink-400 capitalize">{character.personality?.archetype || 'Mysterious'}</div>
              </div>
            </div>
          </div>
          
          {/* Edit Button */}
          <div className="relative navbar-dropdown">
            <button
              onClick={() => {
                setShowEditModal(true);
              }}
              className="w-8 h-8 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>


      {/* Images Grid - Full Height */}
      <div className="h-[calc(100vh-120px)] overflow-hidden">
        {/* Filter Section - Premium Design */}
        <div className="px-8 py-6 border-b border-dark-700/20 backdrop-blur-sm bg-gradient-to-r from-dark-800/30 to-dark-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Filter Pills - Simple */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === 'all' 
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105' 
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  All Images
                </button>
                
                <button
                  onClick={() => setFilter('sfw')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === 'sfw' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/30 scale-105' 
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  Safe
                </button>
                
                <button
                  onClick={() => setFilter('nsfw')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === 'nsfw' 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30 scale-105' 
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  Adult
                </button>
              </div>
              
              {/* NSFW Blur Toggle - Consistent Size */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleBlurNSFW}
                  className={`relative inline-flex h-8 w-11 items-center rounded-full transition-colors duration-200 ${
                    blurNSFW 
                      ? 'bg-pink-600' 
                      : 'bg-dark-600'
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
            
            {/* Generate Button - Premium */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
              <button
                onClick={() => setShowGenerationSettingsModal(true)}
                disabled={isGenerating || !editedCharacter.generation?.style}
                className="relative px-6 py-3 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white rounded-full text-sm font-bold hover:from-pink-500 hover:via-pink-400 hover:to-purple-500 disabled:from-dark-600 disabled:via-dark-700 disabled:to-dark-800 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 border border-pink-500/30"
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New
                </span>
              </button>
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
          <div className="h-full overflow-y-auto p-8 pb-24">
              <div className="masonry-grid">
              <AnimatePresence>
                {filteredImages
                  .map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className="masonry-item group relative mb-8 md:mb-10 lg:mb-12"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-800/30 cursor-pointer"
                     onClick={() => handleImageClick(index)}>
                      <img
                        src={image.imageUrl}
                        alt={`Character image ${index + 1}`}
                        className={`w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none ${
                          isNSFWImage(image) && blurNSFW ? 'blur-lg' : ''
                        }`}
                      />
                      
                      {/* NSFW Devil Emoji Icon */}
                      {isNSFWImage(image) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-sm">😈</span>
                        </div>
                      )}
                      
                      {/* 3-dot menu button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageDropdown(showImageDropdown === image.id ? null : image.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
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
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm font-medium">
                              Image {index + 1}
                            </span>
                            {image.isPrimary && (
                              <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs border border-pink-500/30">
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
                column-gap: 1rem;
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
                  column-gap: 1rem;
                }
              }

              @media (min-width: 768px) {
                .masonry-grid {
                  column-count: 3;
                  column-gap: 1.25rem;
                }
              }

              @media (min-width: 1024px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.5rem;
                }
              }

              @media (min-width: 1280px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.5rem;
                }
              }

              @media (min-width: 1536px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.75rem;
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
                    value={editedCharacter.identity.age || ''}
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
                      <span className="text-white capitalize">{editedCharacter.personality.archetype || 'Not specified'}</span>
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
              <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={filteredImages[zoomedImageIndex]?.imageUrl}
                  alt={`Zoomed character image ${zoomedImageIndex + 1}`}
                  className={`max-w-full max-h-full object-contain rounded-lg ${
                    filteredImages[zoomedImageIndex] && isNSFWImage(filteredImages[zoomedImageIndex]) && blurNSFW ? 'blur-lg' : ''
                  }`}
                />
              
              {/* Close Button */}
              <button
                onClick={handleCloseZoom}
                className="absolute top-4 right-4 w-10 h-10 bg-pink-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-600/90 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Navigation */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousImage();
                    }}
                    className="fixed left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors z-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="fixed right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors z-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                    {zoomedImageIndex + 1} / {filteredImages.length}
                  </div>
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
