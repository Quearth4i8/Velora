import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickGenerator } from './QuickGenerator';
import { CharacterDraft } from '@/lib/types';

type MemoryCard = {
    id: string;
    pairId: string;
    label: string;
};

type MemoryMatchProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const buildMemoryDeck = (): MemoryCard[] => {
    const pairs: Array<{ pairId: string; label: string }> = [
        { pairId: 'a', label: '🍒' },
        { pairId: 'b', label: '💖' },
        { pairId: 'c', label: '⭐' },
        { pairId: 'd', label: '👑' },
        { pairId: 'e', label: '💎' },
        { pairId: 'f', label: '🌹' },
        { pairId: 'g', label: '🔥' },
        { pairId: 'h', label: '🎭' },
    ];

    const deck: MemoryCard[] = pairs.flatMap((p) => [
        { id: `${p.pairId}-1`, pairId: p.pairId, label: p.label },
        { id: `${p.pairId}-2`, pairId: p.pairId, label: p.label },
    ]);

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = deck[i];
        deck[i] = deck[j];
        deck[j] = tmp;
    }
    return deck;
};

const TOTAL_PAIRS = 8;
const INITIAL_TIME = 90;
const INITIAL_LIVES = 5;
const TIME_PENALTY = 5;

export function MemoryMatch({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: MemoryMatchProps) {
    const [deck, setDeck] = useState<MemoryCard[]>(() => buildMemoryDeck());
    const [flipped, setFlipped] = useState<string[]>([]);
    const [matched, setMatched] = useState<Set<string>>(new Set());
    const [memoryStatus, setMemoryStatus] = useState<string>('');
    const [memoryStarted, setMemoryStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [combo, setCombo] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const resetMemory = () => {
        setDeck(buildMemoryDeck());
        setFlipped([]);
        setMatched(new Set());
        setMemoryStatus('');
        setMemoryStarted(false);
        setTimeLeft(INITIAL_TIME);
        setLives(INITIAL_LIVES);
        setCombo(0);
        setIsProcessing(false);
    };

    const startMemory = async () => {
        setMemoryStatus('');
        const ok = await onPlay(cost);
        if (!ok) {
            setMemoryStatus(`Not enough points!`);
            return;
        }
        resetMemory();
        setMemoryStarted(true);
    };

    // Timer countdown
    useEffect(() => {
        if (!memoryStarted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setMemoryStatus('TIME UP! GAME OVER');
                    setMemoryStarted(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [memoryStarted, timeLeft]);

    // Card flip logic
    useEffect(() => {
        if (flipped.length !== 2) return;
        if (isProcessing) return;

        setIsProcessing(true);

        const [a, b] = flipped;
        const ca = deck.find((c) => c.id === a);
        const cb = deck.find((c) => c.id === b);

        if (!ca || !cb) {
            setFlipped([]);
            setIsProcessing(false);
            return;
        }

        if (ca.pairId === cb.pairId) {
            // Match!
            setMatched((prev) => {
                const next = new Set(prev);
                next.add(ca.pairId);
                return next;
            });
            setCombo((prev) => prev + 1);
            setFlipped([]);
            // Small delay to allow animation
            setTimeout(() => setIsProcessing(false), 300);
        } else {
            // Mismatch
            const t = window.setTimeout(() => {
                setFlipped([]);
                setLives((prev) => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setMemoryStatus('NO LIVES LEFT! GAME OVER');
                        setMemoryStarted(false);
                    }
                    return newLives;
                });
                setTimeLeft((prev) => Math.max(0, prev - TIME_PENALTY));
                setCombo(0);
                setIsProcessing(false);
            }, 800);
            return () => window.clearTimeout(t);
        }
    }, [flipped, deck]);

    // Win condition
    useEffect(() => {
        if (matched.size >= TOTAL_PAIRS && memoryStarted) {
            const baseReward = 80;
            const comboBonus = combo * 10;
            const timeBonus = timeLeft;
            const totalReward = baseReward + comboBonus + timeBonus;

            setMemoryStatus(`CLEARED! +${totalReward} PTS`);
            onWin(totalReward);
            setMemoryStarted(false);
        }
    }, [matched, memoryStarted, combo, timeLeft, onWin]);

    const canFlip = flipped.length < 2 && !isProcessing;
    const onFlip = (cardId: string) => {
        if (!memoryStarted) return;
        if (!canFlip) return;
        if (flipped.includes(cardId)) return;
        const card = deck.find((c) => c.id === cardId);
        if (!card) return;
        if (matched.has(card.pairId)) return;
        setFlipped((prev) => [...prev, cardId]);
    };

    const handleSpendForGenerator = async (amount: number) => {
        return await onPlay(amount);
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[600px]">

                {/* LEFT: Game Console */}
                <div className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col shadow-2xl overflow-hidden group">
                    {/* Background FX */}
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-purple-500/5 rounded-[40px] -z-10 group-hover:bg-purple-500/10 transition-colors duration-1000" />

                    {/* Header */}
                    <div className="relative w-full flex items-center justify-between z-30 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <span className="text-xl">🧠</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight">MEMORY MATCH</h2>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Match All Pairs</div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2">
                            {memoryStarted && (
                                <>
                                    {/* Timer */}
                                    <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${timeLeft <= 20 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-white/80'
                                        }`}>
                                        ⏱ {timeLeft}s
                                    </div>

                                    {/* Lives */}
                                    <div className="flex gap-1">
                                        {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center ${i < lives ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-white/20'
                                                }`}>
                                                ❤
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Info Button */}
                            <div className="relative group/info z-50">
                                <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/60 transition-colors">
                                    <span className="font-bold text-xs">?</span>
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 translate-y-2 group-hover/info:translate-y-0 text-left">
                                    <div className="space-y-1 text-[10px] text-white/80">
                                        <div>• Entry: {cost} pts</div>
                                        <div>• {TOTAL_PAIRS} pairs, {INITIAL_TIME}s timer</div>
                                        <div>• {INITIAL_LIVES} lives, -{TIME_PENALTY}s per miss</div>
                                        <div>• Combo bonus: +10pts/match</div>
                                        <div>• Time bonus: +1pt/sec</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Game Area */}
                    <div className="relative flex-1 flex flex-col items-center justify-center z-10">
                        {!memoryStarted && matched.size === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                    <span className="text-4xl">🧠</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Ready to Play?</h3>
                                <p className="text-white/50 text-sm mb-2">Match {TOTAL_PAIRS} pairs in {INITIAL_TIME} seconds</p>
                                <p className="text-white/30 text-xs mb-6">{INITIAL_LIVES} lives • Combo bonuses</p>
                                <button
                                    onClick={startMemory}
                                    className="h-14 px-8 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white font-black text-xl shadow-[0_4px_0_rgb(88,28,135)] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-2"
                                >
                                    <span>START</span>
                                    <div className="w-px h-6 bg-white/20 mx-1" />
                                    <span className="text-sm font-bold opacity-80">{cost}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Combo Display */}
                                {combo > 1 && memoryStarted && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center mb-3"
                                    >
                                        <span className="text-2xl font-black text-yellow-400 drop-shadow-lg">
                                            {combo}x COMBO! 🔥
                                        </span>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                    {deck.map((card) => {
                                        const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
                                        const isMatched = matched.has(card.pairId);

                                        return (
                                            <div
                                                key={card.id}
                                                className="aspect-square perspective-1000"
                                                onClick={() => onFlip(card.id)}
                                            >
                                                <motion.div
                                                    className="relative w-full h-full cursor-pointer"
                                                    style={{ transformStyle: 'preserve-3d' }}
                                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                                >
                                                    {/* Front */}
                                                    <div
                                                        className="absolute inset-0 backface-hidden rounded-xl bg-dark-800 border-2 border-white/5 flex items-center justify-center group hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
                                                        style={{ backfaceVisibility: 'hidden' }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                        </div>
                                                    </div>

                                                    {/* Back */}
                                                    <div
                                                        className={`absolute inset-0 backface-hidden rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-xl ${isMatched
                                                            ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50'
                                                            : 'bg-gradient-to-br from-purple-600 to-purple-500 border-2 border-purple-400'
                                                            }`}
                                                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                                                    >
                                                        {card.label}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Display */}
                    {memoryStarted && (
                        <div className="relative z-20 w-full mt-4">
                            <div className="h-12 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center px-4 overflow-hidden">
                                <AnimatePresence mode='wait'>
                                    {memoryStatus ? (
                                        <motion.div
                                            key="status"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className={`font-black text-base uppercase tracking-wider ${memoryStatus.includes('CLEARED') ? 'text-green-400' : 'text-red-400'
                                                }`}
                                        >
                                            {memoryStatus}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-white/20 text-xs font-bold uppercase tracking-widest"
                                        >
                                            {matched.size}/{TOTAL_PAIRS} Pairs Matched
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Reset Button */}
                    {(memoryStarted || matched.size > 0) && (
                        <div className="relative z-20 w-full mt-3 flex justify-center">
                            <button
                                onClick={resetMemory}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold border border-white/5 transition-colors text-xs"
                            >
                                Reset Game
                            </button>
                        </div>
                    )}
                </div>

                {/* MIDDLE: Quick Generator */}
                <QuickGenerator
                    characterId={characterId}
                    characterName={characterName}
                    character={character}
                    onSpend={handleSpendForGenerator}
                    gameContext="memory"
                />

                {/* RIGHT: Character Card */}
                <div className="relative h-full min-h-[400px] lg:min-h-auto rounded-[40px] overflow-hidden border border-white/5 bg-dark-900 shadow-2xl group">
                    {characterImage ? (
                        <>
                            <img
                                src={characterImage}
                                alt={characterName}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold text-white/80 uppercase tracking-wider border border-white/10">Active Character</span>
                                </div>
                                <h3 className="text-3xl font-black text-white leading-none drop-shadow-md">{characterName || 'Unknown'}</h3>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 p-8 text-center bg-dark-950">
                            <div className="text-5xl mb-4 grayscale opacity-50">🃏</div>
                            <p className="font-bold text-lg">No Character Selected</p>
                            <p className="text-xs mt-2 max-w-[150px]">Select a character from the dashboard to play for them.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
