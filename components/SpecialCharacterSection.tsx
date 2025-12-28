'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, animate, PanInfo, useTransform } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { CharacterDraft } from '@/lib/types';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { useDialog } from '@/components/ui/DialogProvider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SpecialCharacterSectionProps {
  onSelectCharacter: (character: CharacterDraft) => void;
}

export function SpecialCharacterSection({ onSelectCharacter }: SpecialCharacterSectionProps) {
  const [characters, setCharacters] = useState<CharacterDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const dialog = useDialog();

  // Slider Refs & Motion Values
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardWidth = 324; // 300px min-width + 24px gap

  const baseWidth = useMemo(() => characters.length * cardWidth, [characters.length, cardWidth]);

  // The "Infinite Accumulator" magic:
  // trackX wraps continuously, but scrollX grows/shrinks indefinitely.
  // This ensures animate() targets are never interrupted.
  const trackX = useTransform(scrollX, (v: number) => {
    if (baseWidth === 0) return 0;
    // We stay in the middle set's visual range [-2*baseWidth, -baseWidth]
    // The modulo ensures that as scrollX grows, trackX wraps instantly without a spring fighting it.
    const modX = v % baseWidth;
    return modX - baseWidth;
  });

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
      await dialog.alert({ title: 'Missing settings', message: 'This character does not have style and model information.' });
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

  // Triple items for infinite loop: [Set 1][Set 2][Set 3]
  // We stay in Set 2 and jump back/forth as needed.
  const loopedCharacters = useMemo(() => {
    if (characters.length === 0) return [];
    return [...characters, ...characters, ...characters];
  }, [characters]);


  useEffect(() => {
    if (characters.length > 0) {
      scrollX.set(-baseWidth);
    }
  }, [characters.length, baseWidth, scrollX]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const currentX = scrollX.get();
    const velocity = info.velocity.x;

    // Calculate target based on velocity (swipe feel)
    const sweep = velocity * 0.2;
    const targetX = Math.round((currentX + sweep) / cardWidth) * cardWidth;

    animate(scrollX, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 35,
      mass: 0.8
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    const currentX = scrollX.get();
    const moveAmount = cardWidth * 2;
    const targetX = direction === 'left' ? currentX + moveAmount : currentX - moveAmount;

    animate(scrollX, targetX, {
      type: "spring",
      stiffness: 200, // Slightly softer for button clicks
      damping: 30,
      mass: 1
    });
  };

  if (isLoading && characters.length === 0) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto mb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Special <span className="gradient-text">Personalities</span>
          </h2>
          <p className="text-dark-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Discover our collection of premium presets, each with unique prompts and visual styles.
          </p>
        </motion.div>
      </div>

      <div className="relative group/carousel max-w-[1400px] mx-auto px-4 md:px-12">
        {/* Navigation Buttons - Hidden on small touch screens, visible on hover */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 hidden md:flex items-center justify-center bg-dark-900/60 hover:bg-pink-600 border border-white/10 hover:border-pink-500 rounded-full text-white shadow-2xl backdrop-blur-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -translate-x-6 group-hover/carousel:translate-x-0 hover:scale-110 active:scale-90"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 hidden md:flex items-center justify-center bg-dark-900/60 hover:bg-pink-600 border border-white/10 hover:border-pink-500 rounded-full text-white shadow-2xl backdrop-blur-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 translate-x-6 group-hover/carousel:translate-x-0 hover:scale-110 active:scale-90"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Carousel Slider */}
        <div className="relative overflow-visible cursor-grab active:cursor-grabbing" ref={containerRef}>
          <motion.div
            className="flex gap-6"
            style={{ x: trackX }}
            drag="x"
            onDrag={(e, info) => {
              scrollX.set(scrollX.get() + info.delta.x);
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {loopedCharacters.map((character, index) => (
              <motion.div
                key={`${character.id}-${index}`}
                className="flex-none w-[280px] md:w-[300px] h-[400px] md:h-[480px] group/card relative rounded-[32px] overflow-hidden border border-white/5 bg-dark-900/40 backdrop-blur-sm hover:border-pink-500/40 transition-all duration-500 shadow-2xl"
                whileHover={{ y: -8 }}
                onClick={() => !isDragging && onSelectCharacter(character)}
              >
                {/* Image Layer */}
                <div className="absolute inset-0 z-0">
                  {character.generation?.generatedImage ? (
                    <img
                      src={character.generation.generatedImage}
                      alt={character.name || 'Character'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <svg className="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Premium Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent group-hover/card:from-pink-950/40 transition-colors duration-500" />
                </div>

                {/* Info Container */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-10">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-md text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                        {character.generation?.style || 'Velora AI'}
                      </span>
                      {character.identity?.ethnicity && (
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          {character.identity.ethnicity}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight group-hover/card:text-pink-300 transition-colors duration-300">
                      {character.name || 'Special Guest'}
                    </h3>

                    <p className="text-dark-300 text-sm md:text-base line-clamp-2 opacity-0 group-hover/card:opacity-100 translate-y-4 group-hover/card:translate-y-0 transition-all duration-500">
                      {(character.identity as any)?.description || character.personality?.archetype || 'A unique AI companion designed with premium aesthetics and a deep personality.'}
                    </p>
                  </div>
                </div>

                {/* Generate Button - Hover Only */}
                {!character.generation?.generatedImage && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-dark-950/60 backdrop-blur-sm">
                    <div onClick={(e) => e.stopPropagation()}>
                      <PrimaryCTAButton
                        label={generatingImages.has(character.id!) ? 'Creating...' : 'Generate Look'}
                        onClick={() => handleGenerateImage(character)}
                        disabled={generatingImages.has(character.id!)}
                        className="scale-90 shadow-pink-500/20 shadow-2xl"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Ambiance Effects */}
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
