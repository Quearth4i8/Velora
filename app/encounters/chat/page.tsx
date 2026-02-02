'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CharacterDraft } from '@/lib/types';
import { characterAPI } from '@/lib/api';
import { ChatInterface } from '@/components/ChatInterface';
import { getEncounterScenarioById } from '@/data/encounters';
import type { EncounterIntensity, EncounterScenario } from '@/lib/encounters';

export default function EncounterChatPage() {
  const router = useRouter();
  const params = useSearchParams();

  const scenarioId = params.get('scenario') || '';
  const characterId = params.get('character') || '';
  const conversationId = params.get('conversation') || '';
  const mood = params.get('mood') || '';
  const location = params.get('location') || '';
  const intensity = (params.get('intensity') as EncounterIntensity | null) || 'medium';

  const scenario: EncounterScenario | null = useMemo(() => {
    const s = getEncounterScenarioById(scenarioId);
    return s || null;
  }, [scenarioId]);

  const [character, setCharacter] = useState<CharacterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!scenarioId || !characterId) {
          setError('Missing scenario or character');
          return;
        }
        if (!scenario) {
          setError('Scenario not found');
          return;
        }

        const result = await characterAPI.getCharacterFresh(characterId);
        if (result.success && result.data) {
          setCharacter(result.data);
        } else {
          setError(result.error instanceof Error ? result.error : new Error(String(result.error)) || 'Failed to fetch character');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scenarioId, characterId, scenario]);

  const handleBack = () => {
    router.push('/encounters');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading encounter...</p>
        </div>
      </div>
    );
  }

  if (error || !character || !scenario) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-semibold text-dark-200 mb-4">Encounter Not Available</h2>
          <p className="text-dark-400 mb-6">{error instanceof Error ? error.message : String(error) || 'Something went wrong.'}</p>
          <button
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold"
            onClick={handleBack}
          >
            Back to Encounters
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      character={character}
      onBack={handleBack}
      onCharacterUpdate={setCharacter}
      mode="encounter"
      encounterConfig={{
        scenarioId: scenario.id,
        conversationId: conversationId || undefined,
        options: { mood, location, intensity },
      }}
    />
  );
}
