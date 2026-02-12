'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import type { CharacterDraft } from '@/lib/types';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { wallet } from '@/lib/wallet';

type GameId = 'spin' | 'memory' | 'guess';

const formatCharacterLabel = (c: CharacterDraft) => {
  const name = c.name || 'Unnamed';
  const kind = c.characterType === 'special' ? 'Special' : 'Custom';
  return `${name} (${kind})`;
};

export default function MiniGamesPage() {
  const router = useRouter();
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();

  const [characters, setCharacters] = useState<CharacterDraft[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    wallet.getBalance().then(setPoints);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoadingCharacters(true);
      try {
        const [custom, special] = await Promise.all([
          characterAPI.getCharacters(),
          characterAPI.getSpecialCharacters(),
        ]);
        const next: CharacterDraft[] = [];
        if (custom.success && Array.isArray(custom.data)) next.push(...custom.data);
        if (special.success && Array.isArray(special.data)) next.push(...special.data);
        const filtered = next.filter((c) => !c.isGalleryOnly && c?.id);
        setCharacters(filtered);
        if (!selectedCharacterId && filtered.length > 0) {
          setSelectedCharacterId(String(filtered[0].id));
        }
      } finally {
        setIsLoadingCharacters(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = (game: GameId) => {
    if (!selectedCharacterId) return;
    router.push(`/mini-games/play?game=${encodeURIComponent(game)}&character=${encodeURIComponent(selectedCharacterId)}`);
  };

  const games = [
    {
      id: 'spin',
      title: 'Spin the Wheel',
      description: 'Test your luck! Spin for a chance to win the jackpot.',
      icon: '🎰',
      color: 'from-pink-500 to-rose-500',
      cost: 10,
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Find all matching pairs to clear the board and win.',
      icon: '🧠',
      color: 'from-purple-500 to-indigo-500',
      cost: 25,
    },
    {
      id: 'guess',
      title: 'Guess the Prompt',
      description: 'Show off your knowledge by answering prompt questions.',
      icon: '🧩',
      color: 'from-blue-500 to-cyan-500',
      cost: 20,
    },
    {
      id: 'scramble',
      title: 'Word Scramble',
      description: 'Unscramble AI-related terms before the timer runs out.',
      icon: '✍️',
      color: 'from-green-500 to-emerald-500',
      cost: 15,
    },
    {
      id: 'pattern',
      title: 'Pattern Match',
      description: 'Follow the sequence of glowing pads to test your memory.',
      icon: '💿',
      color: 'from-blue-500 to-indigo-500',
      cost: 30,
    },
    {
      id: 'reflex',
      title: 'Reflex Test',
      description: 'Click the targets as fast as possible to test your speed.',
      icon: '⚡',
      color: 'from-red-500 to-orange-500',
      cost: 15,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden font-sans selection:bg-pink-500/30">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="w-full px-4 sm:px-8 lg:px-12 pt-12 pb-20">
          <div className="w-full max-w-[1400px] mx-auto">

            {/* Hero Section */}
            <div className="relative mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-white/70 mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Arcade Zone
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
                  Play & <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Earn</span>
                </h1>
                <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
                  Play mini-games to earn points. Use points to generate exclusive images for your characters.
                </p>
              </motion.div>
            </div>

            {/* Dashboard Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 mb-12"
            >
              {/* Character Selector */}
              <div className="rounded-[40px] border border-white/5 bg-dark-900 backdrop-blur-xl p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute -inset-1 blur-3xl bg-pink-500/5 rounded-[40px] -z-10 group-hover:bg-pink-500/10 transition-colors duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1 tracking-tight">Active Character</h3>
                    <p className="text-sm text-white/40 font-medium">Rewards will be generated for this character</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                      <select
                        value={selectedCharacterId}
                        onChange={(e) => setSelectedCharacterId(e.target.value)}
                        disabled={isLoadingCharacters}
                        className="w-full appearance-none px-5 py-3.5 pr-12 rounded-2xl bg-dark-950/80 border-2 border-white/10 text-white font-bold focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none hover:border-white/20 cursor-pointer"
                      >
                        {characters.map((c) => (
                          <option key={String(c.id)} value={String(c.id)}>
                            {formatCharacterLabel(c)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleBlurNSFW}
                      className="px-5 py-3.5 rounded-2xl border-2 border-white/10 bg-dark-950/80 text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all font-bold text-sm whitespace-nowrap"
                    >
                      {blurNSFW ? 'NSFW: Off' : 'NSFW: On'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet Card */}
              <div className="rounded-[40px] border border-white/5 bg-dark-900 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl min-w-[280px]">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute -inset-1 blur-3xl bg-yellow-500/5 rounded-[40px] -z-10" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">
                      💎
                    </div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Balance</h3>
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight">{points}</div>
                  <div className="mt-4 pt-4 border-t border-white/5 text-xs font-medium text-white/30">
                    Earn more by playing games
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="group relative"
                >
                  <div className="h-full rounded-[40px] border border-white/5 bg-dark-900 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-pink-500/10 flex flex-col">
                    {/* Background FX */}
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className={`absolute -inset-1 blur-3xl bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10 rounded-[40px]`} />

                    {/* Game Icon Header */}
                    <div className={`relative h-48 bg-gradient-to-br ${game.color} p-8 flex flex-col justify-between overflow-hidden`}>
                      <div className="absolute right-0 bottom-0 text-[120px] opacity-20 translate-x-6 translate-y-6 select-none">
                        {game.icon}
                      </div>

                      <div className="relative z-10 w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-2xl">
                        {game.icon}
                      </div>
                      <div className="relative z-10 text-xs font-black text-white/90 uppercase tracking-widest">
                        ENTRY: {game.cost} PTS
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="relative p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{game.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1 font-medium">
                        {game.description}
                      </p>

                      <button
                        onClick={() => startGame(game.id as GameId)}
                        disabled={!selectedCharacterId}
                        className={`w-full h-14 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg
                              ${!selectedCharacterId
                            ? 'bg-white/5 text-white/20 cursor-not-allowed border-2 border-white/5'
                            : 'bg-gradient-to-b from-white to-gray-100 text-dark-950 hover:from-pink-50 hover:to-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px]'
                          }
                             `}
                      >
                        {!selectedCharacterId ? 'Select Character' : 'PLAY NOW'}
                        {selectedCharacterId && (
                          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
