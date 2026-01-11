'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, animate, useTransform } from 'framer-motion';
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
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialog = useDialog();

  // Slider Refs & Motion Values
  const containerRef = useRef<HTMLDivElement>(null);
  const cardWidth = 324; // 300px min-width + 24px gap
  const baseWidth = useMemo(() => characters.length * cardWidth, [characters.length]);
  const currentIndexRef = useRef(0);

  // Smooth spring for the scroll position
  const scrollValue = useMotionValue(0);
  const scrollX = useSpring(scrollValue, {
    stiffness: 400,
    damping: 40,
    mass: 1
  });

  // True mathematical wrap: ensures the carousel loops seamlessly regardless of how far you scroll
  const trackX = useTransform(scrollX, (v) => {
    if (baseWidth === 0) return 0;
    // Maps any accumulated scroll value (v) to a repeating range within [-baseWidth, 0]
    return ((v % baseWidth) + baseWidth) % baseWidth - baseWidth;
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

  // Double items for infinite loop: [Set 1][Set 2]
  // The mathematical wrap handles the seamless transition between them.
  const loopedCharacters = useMemo(() => {
    if (characters.length === 0) return [];
    return [...characters, ...characters];
  }, [characters]);


  useEffect(() => {
    if (characters.length > 0) {
      scrollValue.set(0);
    }
  }, [characters.length]);

  const getNormalizedOffset = useCallback(
    (v: number) => {
      if (baseWidth === 0) return 0;
      return ((v % baseWidth) + baseWidth) % baseWidth;
    },
    [baseWidth]
  );

  const getClosestIndexFromValue = useCallback(
    (v: number) => {
      if (characters.length === 0) return 0;
      const offset = getNormalizedOffset(-v);
      const approx = Math.round(offset / cardWidth);
      return ((approx % characters.length) + characters.length) % characters.length;
    },
    [cardWidth, characters.length, getNormalizedOffset]
  );

  const getNearestScrollForIndex = useCallback(
    (index: number, currentV: number) => {
      if (characters.length === 0) return 0;
      const i = ((index % characters.length) + characters.length) % characters.length;
      const base = -(i * cardWidth);
      if (baseWidth === 0) return base;

      // There are infinitely many equivalent positions: base - k*baseWidth
      // Choose the one closest to the current value to prevent visible reversal/jumps.
      const k = Math.round((base - currentV) / baseWidth);
      return base - k * baseWidth;
    },
    [baseWidth, cardWidth, characters.length]
  );

  const snapToIndex = useCallback(
    (index: number, opts?: { instant?: boolean }) => {
      if (characters.length === 0) return;
      const nextIndex = ((index % characters.length) + characters.length) % characters.length;
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      const currentV = scrollValue.get();
      const targetX = getNearestScrollForIndex(nextIndex, currentV);

      if (opts?.instant) {
        scrollValue.set(targetX);
        return;
      }

      animate(scrollValue, targetX, {
        type: 'spring',
        stiffness: 200,
        damping: 28,
      });
    },
    [characters.length, getNearestScrollForIndex, scrollValue]
  );

  const moveBy = useCallback(
    (delta: number) => {
      const current = scrollValue.get();
      const nextIndex = getClosestIndexFromValue(current) + delta;
      snapToIndex(nextIndex);
    },
    [getClosestIndexFromValue, scrollValue, snapToIndex]
  );

  const scroll = (direction: 'left' | 'right') => {
    const step = window.innerWidth < 768 ? 1 : 2;
    moveBy(direction === 'left' ? -step : step);
  };

  useEffect(() => {
    if (characters.length === 0) return;
    snapToIndex(0, { instant: true });
  }, [characters.length, snapToIndex]);

  useEffect(() => {
    if (characters.length === 0) return;
    const unsubscribe = scrollValue.on('change', (v) => {
      const idx = getClosestIndexFromValue(v);
      currentIndexRef.current = idx;
      setActiveIndex(idx);
    });
    return () => unsubscribe();
  }, [characters.length, getClosestIndexFromValue, scrollValue]);

  useEffect(() => {
    if (characters.length === 0) return;
    if (isInteracting) return;

    const id = window.setInterval(() => {
      moveBy(1);
    }, 4500);

    return () => window.clearInterval(id);
  }, [characters.length, isInteracting, moveBy]);

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
            Discover perfectly tuned presets, each with unique prompts and visual styles.
          </p>
        </motion.div>
      </div>

      <div className="relative group/carousel max-w-[1400px] mx-auto px-4 md:px-12">
        {/* Navigation Buttons - Hidden on small touch screens, visible on hover */}
        <button
          onClick={() => scroll('left')}
          aria-label="Previous"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 hidden md:flex items-center justify-center bg-dark-900/60 hover:bg-pink-600 border border-white/10 hover:border-pink-500 rounded-full text-white shadow-2xl backdrop-blur-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -translate-x-6 group-hover/carousel:translate-x-0 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/70"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={() => scroll('right')}
          aria-label="Next"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 hidden md:flex items-center justify-center bg-dark-900/60 hover:bg-pink-600 border border-white/10 hover:border-pink-500 rounded-full text-white shadow-2xl backdrop-blur-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 translate-x-6 group-hover/carousel:translate-x-0 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/70"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Carousel Slider */}
        <div
          className="relative overflow-visible focus-visible:outline-none"
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Special personalities"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              moveBy(-1);
            }
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              moveBy(1);
            }
          }}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onFocus={() => setIsInteracting(true)}
          onBlur={() => setIsInteracting(false)}
        >
          <motion.div
            className="flex gap-6"
            style={{ x: trackX }}
            drag="x"
            dragElastic={0.08}
            dragMomentum={true}
            onDragStart={() => setIsInteracting(true)}
            onDragEnd={() => {
              setIsInteracting(false);
              const current = scrollValue.get();
              const idx = getClosestIndexFromValue(current);
              snapToIndex(idx);
            }}
          >
            {loopedCharacters.map((character, index) => (
              <motion.div
                key={`${character.id}-${index}`}
                className="flex-none w-[280px] md:w-[300px] h-[400px] md:h-[480px] group/card relative rounded-[32px] overflow-hidden border border-white/5 bg-dark-900/40 backdrop-blur-sm hover:border-pink-500/40 transition-all duration-500 shadow-2xl cursor-pointer"
                onClick={() => onSelectCharacter(character)}
              >
                {/* Image Layer */}
                <div className="absolute inset-0 z-0">
                  {character.generation?.generatedImage ? (
                    <img
                      src={character.generation.generatedImage}
                      alt={character.name || 'Character'}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight group-hover/card:text-pink-400 transition-colors duration-300">
                    {character.name || 'Special Guest'}
                  </h3>

                  <div className="flex items-center gap-2 text-dark-300 text-sm md:text-base font-medium opacity-0 group-hover/card:opacity-100 translate-y-4 group-hover/card:translate-y-0 transition-all duration-500">
                    <span>{character.generation?.style ? character.generation.style.charAt(0).toUpperCase() + character.generation.style.slice(1) : 'Premium'}</span>
                    <span className="w-1 h-1 rounded-full bg-pink-500/50" />
                    <span className="text-white/70">{character.identity?.ethnicity || 'Unique'}</span>
                    <span className="w-1 h-1 rounded-full bg-pink-500/50" />
                    <span className="text-pink-400/80">{character.identity?.age || '20s'}Y</span>
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

          {characters.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2" aria-label="Carousel pagination">
              {characters.map((c, i) => (
                <button
                  key={c.id || i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => snapToIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/70 ${i === activeIndex ? 'w-10 bg-pink-500/80' : 'w-2.5 bg-white/20 hover:bg-white/35'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ambiance Effects */}
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
