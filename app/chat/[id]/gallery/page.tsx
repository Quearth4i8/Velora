'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CharacterDraft } from '@/lib/types';
import { characterAPI } from '@/lib/api';
import { CharacterGalleryComponent } from '@/components/CharacterGallery';

export default function CharacterGallery() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const characterId = params.id as string;
        if (!characterId) {
          setError('Character ID is required');
          setLoading(false);
          return;
        }

        const result = await characterAPI.getCharacter(characterId);
        if (result.success && result.data) {
          setCharacter(result.data);
        } else {
          setError(result.error instanceof Error ? result.error : new Error(String(result.error)) || 'Failed to fetch character');
        }
      } catch (err) {
        setError(typeof err === 'string' ? err : 'An error occurred while fetching the character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [params.id]);

  const handleBack = () => {
    if (character?.characterType === 'special') {
      router.push(`/special/${params.id}`);
      return;
    }

    router.push(`/${params.id}`);
  };

  const handleCharacterUpdate = (updatedCharacter: CharacterDraft) => {
    setCharacter(updatedCharacter);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading character gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-dark-200 mb-4">Character Not Found</h2>
          <p className="text-dark-400 mb-6">{error instanceof Error ? error.message : String(error) || 'This character could not be found.'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Character
          </button>
        </div>
      </div>
    );
  }

  return <CharacterGalleryComponent character={character} onBack={handleBack} onCharacterUpdate={handleCharacterUpdate} />;
}
