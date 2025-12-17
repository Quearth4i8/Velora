'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, CharacterImage } from '@/lib/types';
import { automatic1111API } from '@/lib/automatic1111';
import { characterAPI } from '@/lib/api';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

interface CharacterGalleryProps {
  character: CharacterDraft;
  onBack: () => void;
  onCharacterUpdate: (updatedCharacter: CharacterDraft) => void;
}

export function CharacterGalleryComponent({ character, onBack, onCharacterUpdate }: CharacterGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterDraft>(character);
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState<string | null>(null);
  const [showNavbarDropdown, setShowNavbarDropdown] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load character images from gallery
  useEffect(() => {
    if (character.id) {
      loadCharacterImages();
    }
  }, [character.id]);

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
      const imageUrl = await automatic1111API.generateCharacterImage(editedCharacter);
      
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
    setZoomedImageIndex(index);
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  const handlePreviousImage = () => {
    setZoomedImageIndex((prev) => (prev === 0 ? characterImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setZoomedImageIndex((prev) => (prev === characterImages.length - 1 ? 0 : prev + 1));
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
    setEditedCharacter(prev => {
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
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-dark-400 hover:text-dark-200 transition-colors group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
          
          {/* 3 Dots Menu */}
          <div className="relative navbar-dropdown">
            <button
              onClick={() => setShowNavbarDropdown(!showNavbarDropdown)}
              className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-dark-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showNavbarDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowNavbarDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-dark-200 hover:bg-dark-700 transition-colors text-sm"
                >
                  Edit Character
                </button>
                <button
                  onClick={() => {
                    handleGenerateNewImage();
                    setShowNavbarDropdown(false);
                  }}
                  disabled={isGenerating || !editedCharacter.generation?.style}
                  className="w-full px-4 py-2 text-left text-dark-200 hover:bg-dark-700 transition-colors text-sm disabled:text-dark-500 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate New Image'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Images Grid - Full Height */}
      <div className="h-[calc(100vh-140px)] overflow-hidden">
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
              onClick={handleGenerateNewImage}
              disabled={isGenerating || !editedCharacter.generation?.style}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <AnimatePresence>
                {characterImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-800/30 cursor-pointer"
                     onClick={() => handleImageClick(index)}>
                      <img
                        src={image.imageUrl}
                        alt={`Character image ${index + 1}`}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                      
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
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
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
          </div>
        )}
      </div>

      {/* Edit Modal */}
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
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-200">Edit Character</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-dark-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="text-dark-500 text-xs block mb-2">Name</label>
                  <input
                    type="text"
                    value={editedCharacter.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700/50 text-dark-200 rounded-lg border border-dark-600/50 focus:border-purple-500/50 focus:outline-none"
                    placeholder="Enter character name..."
                  />
                </div>
                
                <div>
                  <label className="text-dark-500 text-xs block mb-2">Age</label>
                  <input
                    type="number"
                    value={editedCharacter.identity.age || ''}
                    onChange={(e) => handleInputChange('identity.age', e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700/50 text-dark-200 rounded-lg border border-dark-600/50 focus:border-purple-500/50 focus:outline-none"
                    placeholder="Enter age..."
                    min="18"
                    max="100"
                  />
                </div>
                
                <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/50">
                  <h4 className="text-sm font-medium text-purple-400 mb-3">Character Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Archetype:</span>
                      <span className="text-dark-200 capitalize">{editedCharacter.personality.archetype || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Style:</span>
                      <span className="text-dark-200 capitalize">{editedCharacter.generation?.style || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-dark-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-dark-700/50 text-dark-300 rounded-lg border border-dark-600/50 hover:bg-dark-600/50 transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
                <PrimaryCTAButton
                  label="Save Changes"
                  onClick={handleSaveCharacter}
                  className="px-6"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  src={characterImages[zoomedImageIndex]?.imageUrl}
                  alt={`Zoomed character image ${zoomedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              
              {/* Close Button */}
              <button
                onClick={handleCloseZoom}
                className="absolute top-4 right-4 w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-600/90 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Navigation */}
              {characterImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                    {zoomedImageIndex + 1} / {characterImages.length}
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
