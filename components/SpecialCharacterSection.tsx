'use client';

import React, { useEffect, useState } from 'react';
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((character, index) => (
              <motion.div
                key={character.id}
                className="group relative bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                onClick={() => onSelectCharacter(character)}
              >
                <div className="relative h-80 bg-gradient-to-br from-pink-600/10 to-purple-500/10 overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center border border-dark-600/50">
                        <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                    <div className="text-white">
                      <h3 className="text-lg font-semibold mb-1">{character.name || 'Special Character'}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">
                          {character.identity?.ethnicity || 'Unknown'} •{' '}
                          {character.identity?.age ? `${character.identity.age} years old` : 'Age not set'}
                        </span>
                        <span className="text-white/60 text-xs capitalize">
                          {character.generation?.style === 'anime'
                            ? 'Anime'
                            : character.generation?.style === 'realistic'
                              ? 'Realistic'
                              : character.generation?.style === 'artistic'
                                ? 'Artistic'
                                : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!character.generation?.generatedImage && character.generation?.style && character.generation?.model && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div onClick={(e) => e.stopPropagation()}>
                        <PrimaryCTAButton
                          label={generatingImages.has(character.id!) ? 'Generating...' : 'Generate Image'}
                          onClick={() => handleGenerateImage(character)}
                          disabled={generatingImages.has(character.id!)}
                          className="text-sm py-2.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-pink-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
