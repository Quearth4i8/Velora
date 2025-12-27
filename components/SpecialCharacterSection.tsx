'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { CharacterDraft } from '@/lib/types';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { useDialog } from '@/components/ui/DialogProvider';

interface SpecialCharacterSectionProps {
  onSelectCharacter: (character: CharacterDraft) => void;
}

export function SpecialCharacterSection({ onSelectCharacter }: SpecialCharacterSectionProps) {
  const [characters, setCharacters] = useState<CharacterDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const dialog = useDialog();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      const result = await characterAPI.getSpecialCharacters();
      if (result.success) {
        setCharacters(result.data || []);
      } else {
        setError('Failed to load special characters');
      }
    } catch (err) {
      console.error('Error loading special characters:', err);
      setError('An error occurred while loading special characters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (character: CharacterDraft) => {
    if (!character.id) return;

    if (!character.generation?.style || !character.generation?.model) {
      await dialog.alert({
        title: 'Missing settings',
        message: 'This character does not have style and model information.',
      });
      return;
    }

    setGeneratingImages(prev => new Set(prev).add(character.id!));

    try {
      await automatic1111API.generateCharacterImage(character);
      await loadCharacters();
    } catch (err) {
      console.error('Error generating image for special character:', err);
      await dialog.alert({ title: 'Error', message: 'Failed to generate image. Please try again.' });
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(character.id!);
        return next;
      });
    }
  };

  if (isLoading && characters.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <div className="h-10 bg-dark-800/50 rounded-lg animate-pulse mb-4 max-w-md mx-auto"></div>
            <div className="h-5 bg-dark-800/30 rounded-lg w-2/3 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-dark-800/30 rounded-2xl h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Infinite Scroll Logic
  const extendedCharacters = useMemo(() => {
    if (characters.length === 0) return [];
    // Triple the list to have a middle buffer
    return [...characters, ...characters, ...characters];
  }, [characters]);

  useEffect(() => {
    const container = document.getElementById('special-char-scroll-container');
    if (container && characters.length > 0) {
      // Calculate width of one set
      // We can't easily know the exact pixel width without measuring, but we can assume the scrollWidth is partitioned equaly
      // Initial scroll to middle set
      const initScroll = () => {
        const totalWidth = container.scrollWidth;
        const oneSetWidth = totalWidth / 3;
        container.scrollLeft = oneSetWidth;
      };

      // Small timeout to allow layout to settle
      setTimeout(initScroll, 50);
    }
  }, [characters]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const totalWidth = container.scrollWidth;
    const oneSetWidth = totalWidth / 3;
    const scrollLeft = container.scrollLeft;

    // Tolerance for floating point diffs
    const buffer = 10;

    if (scrollLeft <= buffer) {
      // Wrap to end of middle set (start of 3rd set - oneSetWidth) -> start of middle set
      // Actually, if we hit 0, we jump to middle set start.
      container.scrollLeft = oneSetWidth + scrollLeft;
    } else if (scrollLeft >= oneSetWidth * 2 - buffer) {
      // Wrap to start of middle set
      container.scrollLeft = scrollLeft - oneSetWidth;
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Special Characters</h2>
          <p className="text-dark-400">Premium presets with dedicated prompts & LoRAs</p>
        </div>

        {error && (
          <div className="text-center mb-8">
            <p className="text-red-400 mb-4">{error instanceof Error ? error.message : String(error)}</p>
            <PrimaryCTAButton label="Retry" onClick={loadCharacters} />
          </div>
        )}

        {!error && characters.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-dark-400">No special characters yet.</p>
          </motion.div>
        ) : (
          <div className="relative group/carousel">
            {/* Left Scroll Button */}
            <button
              onClick={() => {
                const container = document.getElementById('special-char-scroll-container');
                if (container) {
                  const cardWidth = 320;
                  container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
              }}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-dark-800/80 hover:bg-pink-600 border border-dark-600 hover:border-pink-500 rounded-full text-white shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -translate-x-full group-hover/carousel:translate-x-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Scrollable Container */}
            <div
              id="special-char-scroll-container"
              className="flex overflow-x-auto gap-6 px-2 py-4 scrollbar-hide snap-x snap-mandatory mask-image-edges scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onScroll={handleScroll}
            >
              {extendedCharacters.map((character, index) => (
                <motion.div
                  // Unique key needed for React. Combine ID with index to avoid duplicates in tripled list
                  key={`${character.id}-${index}`}
                  className="flex-none w-[calc(25%-18px)] min-w-[300px] snap-start group relative bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-pink-500/20"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index % characters.length) * 0.1, duration: 0.5 }}
                  onClick={() => onSelectCharacter(character)}
                >
                  <div className="relative h-96 bg-gradient-to-br from-pink-600/10 to-purple-500/10 overflow-hidden">
                    {character.generation?.generatedImage ? (
                      <img
                        src={character.generation.generatedImage}
                        alt={character.name || 'Special Character'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          console.error('Image failed to load:', character.generation?.generatedImage);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-[2px]"></div>
                        <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center border border-dark-600/50 relative z-10">
                          <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-6 px-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-white">
                        <h3 className="text-xl font-bold mb-1.5 font-display tracking-tight text-white group-hover:text-pink-300 transition-colors">{character.name || 'Special Character'}</h3>
                        <div className="flex items-center gap-3 text-sm text-dark-300">
                          <span className="bg-dark-950/50 px-2 py-0.5 rounded text-xs font-medium border border-white/10 uppercase tracking-wider">
                            {character.generation?.style || 'Unknown'}
                          </span>
                          <span className="w-1 h-1 bg-dark-500 rounded-full"></span>
                          <span>
                            {character.identity?.ethnicity || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!character.generation?.generatedImage && character.generation?.style && character.generation?.model && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <div onClick={(e) => e.stopPropagation()}>
                          <PrimaryCTAButton
                            label={generatingImages.has(character.id!) ? 'Generating...' : 'Generate Look'}
                            onClick={() => handleGenerateImage(character)}
                            disabled={generatingImages.has(character.id!)}
                            className="text-sm py-2 px-6 shadow-xl shadow-pink-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => {
                const container = document.getElementById('special-char-scroll-container');
                if (container) {
                  const cardWidth = 320;
                  container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
              }}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-dark-800/80 hover:bg-pink-600 border border-dark-600 hover:border-pink-500 rounded-full text-white shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 translate-x-full group-hover/carousel:translate-x-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
