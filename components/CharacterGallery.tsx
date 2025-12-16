'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage } from '@/lib/types';
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
  const [characterImages, setCharacterImages] = useState<string[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Initialize with current image if exists
    if (character.generation?.generatedImage) {
      setCharacterImages([character.generation.generatedImage]);
    }
  }, [character]);

  const handleGenerateNewImage = async () => {
    if (!editedCharacter.generation?.style || !editedCharacter.generation?.model) {
      alert('Character must have style and model selected to generate images');
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await automatic1111API.generateCharacterImage(editedCharacter);
      
      // Add to gallery
      setCharacterImages(prev => [...prev, imageUrl]);
      
      // Update character with new image
      const updatedCharacter = {
        ...editedCharacter,
        generation: {
          ...editedCharacter.generation,
          generatedImage: imageUrl,
          generationStatus: 'completed' as const,
        }
      };
      
      setEditedCharacter(updatedCharacter);
      
      // Save to database
      if (character.id) {
        const result = await characterAPI.updateCharacterImage(character.id, imageUrl);
        if (result.success) {
          onCharacterUpdate(updatedCharacter);
        } else {
          throw new Error('Failed to save image to database');
        }
      }
    } catch (error) {
      console.error('Error generating new image:', error);
      alert('Failed to generate new image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCharacter = async () => {
    try {
      // Check if character has an ID
      if (!character.id) {
        throw new Error('Character ID is missing. Cannot update character.');
      }
      
      // Debug: Log the edited character data
      console.log('Saving character with data:', editedCharacter);
      console.log('Age value:', editedCharacter.identity?.age);
      
      // Update character in database
      const result = await characterAPI.updateCharacter(character.id, editedCharacter);
      if (result.success) {
        onCharacterUpdate(editedCharacter);
        setShowEditModal(false);
      } else {
        throw new Error('Failed to update character');
      }
    } catch (error) {
      console.error('Error saving character:', error);
      alert(`Failed to save character: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-dark-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-dark-200 hover:bg-dark-700 transition-colors text-sm"
                >
                  Edit Character
                </button>
                <button
                  onClick={() => {
                    handleGenerateNewImage();
                    setShowDropdown(false);
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
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-800/30 cursor-pointer"
                     onClick={() => handleImageClick(index)}>
                      <img
                        src={image}
                        alt={`Character image ${index + 1}`}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm font-medium">
                              Image {index + 1}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                                Current
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
                  src={characterImages[zoomedImageIndex]}
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
