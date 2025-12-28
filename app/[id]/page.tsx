'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CharacterDraft } from '@/lib/types';
import { characterAPI } from '@/lib/api';
import { ChatInterface } from '@/components/ChatInterface';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

export default function CharacterDetail() {
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

        // Force fresh fetch from database to avoid caching issues
        const result = await characterAPI.getCharacterFresh(characterId);
        if (result.success && result.data) {
          setCharacter(result.data);
        } else {
          setError(result.error instanceof Error ? result.error : new Error(String(result.error)) || 'Failed to fetch character');
        }
      } catch (err) {
        setError('An error occurred while fetching the character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [params.id]);

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading character...</p>
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
          <PrimaryCTAButton label="Back to Home" onClick={handleBack} />
        </div>
      </div>
    );
  }

  return <ChatInterface character={character} onBack={handleBack} onCharacterUpdate={setCharacter} />;
}
