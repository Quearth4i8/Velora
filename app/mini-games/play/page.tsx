'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import type { CharacterDraft } from '@/lib/types';
import { wallet } from '@/lib/wallet';
import { SpinWheel } from '@/components/mini-games/SpinWheel';
import { MemoryMatch } from '@/components/mini-games/MemoryMatch';
import { GuessThePrompt } from '@/components/mini-games/GuessThePrompt';
import { WordScramble } from '@/components/mini-games/WordScramble';
import { PatternMatch } from '@/components/mini-games/PatternMatch';
import { ReflexTest } from '@/components/mini-games/ReflexTest';

type GameId = 'spin' | 'memory' | 'guess' | 'scramble' | 'pattern' | 'reflex';

const GAME_COSTS = {
  spin: 10,
  memory: 25,
  guess: 20,
  scramble: 15,
  pattern: 30,
  reflex: 15,
} as const;

const normalizeGameId = (value: string | null): GameId | null => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'spin' || v === 'memory' || v === 'guess' || v === 'scramble' || v === 'pattern' || v === 'reflex') return v as GameId;
  return null;
};

export default function MiniGamesPlayPage() {
  const router = useRouter();
  const params = useSearchParams();

  const gameId = normalizeGameId(params.get('game'));
  const characterIdFromQuery = String(params.get('character') || '').trim();

  const [points, setPoints] = useState(0);
  const [character, setCharacter] = useState<CharacterDraft | null>(null);

  useEffect(() => {
    wallet.getBalance().then(setPoints);
  }, []);

  const addPoints = (delta: number) => {
    wallet.increment(delta).then(setPoints);
  };

  const spendForGame = async (cost: number): Promise<boolean> => {
    const res = await wallet.spend(cost);
    setPoints(res.balance);
    return res.ok;
  };

  useEffect(() => {
    if (!characterIdFromQuery) return;
    const loadCharacter = async () => {
      const res = await characterAPI.getCharacterFresh(characterIdFromQuery);
      if (res.success && res.data) setCharacter(res.data);
    };
    loadCharacter();
  }, [characterIdFromQuery]);

  const backgroundImage = character?.generation?.generatedImage || '';

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        <AnimatedBackground />
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center max-w-md mx-4 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
            <p className="text-white/50 mb-6">Please select a valid game from the menu.</p>
            <button
              onClick={() => router.push('/mini-games')}
              className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-colors"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden font-sans selection:bg-pink-500/30">
      <AnimatedBackground />

      {backgroundImage && (
        <div
          className="absolute inset-0 opacity-20 blur-sm scale-110"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/90 to-dark-950" />

      <div className="relative z-10">
        <Navbar />

        <div className="w-full px-4 sm:px-8 lg:px-12 pt-12 pb-16">
          <div className="w-full max-w-[1400px] mx-auto">

            {/* Game Container */}
            <div className="min-h-[600px]">
              {gameId === 'spin' && (
                <SpinWheel
                  cost={GAME_COSTS.spin}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}

              {gameId === 'memory' && (
                <MemoryMatch
                  cost={GAME_COSTS.memory}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}

              {gameId === 'guess' && (
                <GuessThePrompt
                  cost={GAME_COSTS.guess}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}

              {gameId === 'scramble' && (
                <WordScramble
                  cost={GAME_COSTS.scramble}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}

              {gameId === 'pattern' && (
                <PatternMatch
                  cost={GAME_COSTS.pattern}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}

              {gameId === 'reflex' && (
                <ReflexTest
                  cost={GAME_COSTS.reflex}
                  onPlay={(cost) => spendForGame(cost)}
                  onWin={(pts) => addPoints(pts)}
                  characterImage={character?.generation?.generatedImage}
                  characterName={character?.name}
                  characterId={character?.id}
                  character={character}
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
