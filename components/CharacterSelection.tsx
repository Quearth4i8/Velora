'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { CharacterDraft, AgeGroup, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, HairColor, EyeColor, CharacterStyle, AIModel } from '@/lib/types';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

interface CharacterSelectionProps {
  onSelectCharacter: (character: CharacterDraft) => void;
  onCreateNew: () => void;
}

export function CharacterSelection({ onSelectCharacter, onCreateNew }: CharacterSelectionProps) {
  const [characters, setCharacters] = useState<CharacterDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Start loading immediately
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      
      // Check cache first with error handling
      const cacheKey = 'characters_selection';
      try {
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache for 3 minutes
          if (Date.now() - timestamp < 180000) {
            setCharacters(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (storageError) {
        // Handle localStorage quota exceeded error
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing cache');
          // Clear all character-related cache items
          const keysToRemove = ['characters_selection', 'characters_list_10', 'characters_list_50'];
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Failed to clear cache key:', key);
            }
          });
        } else {
          console.warn('localStorage access failed:', storageError);
        }
      }
      
      const result = await characterAPI.getCharacters();
      if (result.success) {
        setCharacters(result.data || []);
        
        // Cache the result with error handling
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result.data || [],
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          // Silently handle cache errors - don't break the app
          if (cacheError instanceof DOMException && cacheError.name === 'QuotaExceededError') {
            console.warn('Cache quota exceeded, skipping cache');
          } else {
            console.warn('Failed to cache characters:', cacheError);
          }
        }
      } else {
        setError('Failed to load characters');
      }
    } catch (err) {
      console.error('Error loading characters:', err);
      setError('An error occurred while loading characters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCharacter = (character: CharacterDraft) => {
    onSelectCharacter(character);
  };

  const handleGenerateImage = async (character: CharacterDraft) => {
    if (!character.generation?.style || !character.generation?.model) {
      alert('This character does not have style and model information. Please recreate the character with style selection.');
      return;
    }

    setGeneratingImages(prev => new Set(prev).add(character.id!));

    try {
      const imageUrl = await automatic1111API.generateCharacterImage(character);
      
      // The image is now automatically uploaded to storage and the database is updated
      // So we just need to reload the characters to get the updated data
      await loadCharacters();
    } catch (error) {
      console.error('Error generating image for existing character:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(character.id!);
        return newSet;
      });
    }
  };

  if (isLoading && characters.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-dark-300 text-lg font-medium">Loading characters...</p>
          <p className="text-dark-500 text-sm mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // Show skeleton while loading in background
  if (isLoading && characters.length > 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-12 bg-dark-800/50 rounded-lg animate-pulse mb-4"></div>
            <div className="h-6 bg-dark-800/30 rounded-lg w-2/3 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-dark-800/30 rounded-2xl h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error instanceof Error ? error.message : String(error)}</p>
            <PrimaryCTAButton label="Retry" onClick={loadCharacters} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="gradient-text">Your Characters</span>
          </h1>
          <p className="text-center text-dark-400 text-base max-w-2xl mx-auto">
            Choose a companion to chat with or create your perfect AI character
          </p>
        </motion.div>

        {characters.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark-200 mb-2">No Characters Yet</h3>
              <p className="text-dark-400 mb-6 max-w-md mx-auto">Start your journey by creating your first AI companion</p>
            </div>
            <PrimaryCTAButton label="Create Your First Character" onClick={onCreateNew} />
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {characters.map((character, index) => (
                <motion.div
                  key={character.id}
                  className="group relative bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 cursor-pointer character-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => handleSelectCharacter(character)}
                >
                  {/* Character Image Section - Full height card */}
                  <div className="relative h-80 bg-gradient-to-br from-purple-600/10 to-purple-500/10 overflow-hidden">
                    {character.generation?.generatedImage ? (
                      <>
                        {/* Debug info - can be removed */}
                          {false && character.generation.generatedImage && (
                            <div className="text-xs text-gray-500 mt-1">
                              Image loaded successfully
                            </div>
                          )}
                        <img 
                          src={character.generation.generatedImage} 
                          alt={character.name || 'Character'}
                          className="w-full h-full object-cover character-image"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            console.error('Image failed to load:', e);
                            console.error('Image URL length:', character.generation?.generatedImage?.length);
                            // Fallback to placeholder
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center border border-dark-600/50">
                          <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Character Info Overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                    <div className="text-white">
                      <h3 className="text-lg font-semibold mb-1">
                        {character.name || 'Character'}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">
                          {character.identity.ethnicity} • {character.identity.age} years old
                        </span>
                        <span className="text-white/60 text-xs capitalize">
                          {character.generation?.style === 'anime' ? 'Anime' : 
                           character.generation?.style === 'realistic' ? 'Realistic' : 
                           character.generation?.style === 'artistic' ? 'Artistic' : 
                           'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Generate Image Button for characters without images */}
                  {!character.generation?.generatedImage && character.generation?.style && character.generation?.model && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div onClick={(e) => e.stopPropagation()}>
                        <PrimaryCTAButton
                          label={generatingImages.has(character.id!) ? "Generating..." : "Generate Image"}
                          onClick={() => handleGenerateImage(character)}
                          disabled={generatingImages.has(character.id!)}
                          className="text-sm py-2.5"
                        />
                      </div>
                    </div>
                  )}
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>

            </>
        )}
      </div>
    </div>
  );
}
