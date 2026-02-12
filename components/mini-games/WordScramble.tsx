import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickGenerator } from './QuickGenerator';
import { CharacterDraft } from '@/lib/types';

type WordScrambleProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const WORDS = [
    'MASTERPIECE', 'NEGATIVE', 'SAMPLING', 'KARRAS', 'LORA',
    'CHECKPOINT', 'DREAMBOOTH', 'UPSCALE', 'LATENT', 'WEIGHT'
];

const SCRAMBLE_TIME = 30;

export function WordScramble({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: WordScrambleProps) {
    const [currentWord, setCurrentWord] = useState('');
    const [scrambled, setScrambled] = useState('');
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('');
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SCRAMBLE_TIME);
    const [score, setScore] = useState(0);

    const scramble = (word: string) => {
        return word.split('').sort(() => Math.random() - 0.5).join('');
    };

    const nextWord = () => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setCurrentWord(word);
        setScrambled(scramble(word));
        setUserInput('');
        setTimeLeft(SCRAMBLE_TIME);
    };

    const start = async () => {
        setStatus('');
        const ok = await onPlay(cost);
        if (!ok) {
            setStatus('Not enough points!');
            return;
        }
        setStarted(true);
        setScore(0);
        nextWord();
    };

    useEffect(() => {
        if (!started || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setStatus('TIMEOUT!');
                    setStarted(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [started, timeLeft]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.toUpperCase() === currentWord) {
            const reward = 40 + timeLeft;
            setScore(reward);
            setStatus(`CORRECT! +${reward} PTS`);
            onWin(reward);
            setStarted(false);
        } else {
            setStatus('WRONG! TRY AGAIN');
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[600px]">
                {/* Game Console */}
                <div className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-green-500/5 rounded-[40px] -z-10 group-hover:bg-green-500/10 transition-colors duration-1000" />

                    <div className="relative z-10 w-full flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => window.history.back()} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-xl">✍️</div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight">WORD SCRAMBLE</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">Unscramble the word</p>
                            </div>
                        </div>
                        {started && (
                            <div className={`px-4 py-2 rounded-xl border font-mono text-sm font-black ${timeLeft < 10 ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}>
                                ⏱ {timeLeft}s
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center z-10">
                        {!started ? (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-8 shadow-xl shadow-green-500/20 mx-auto text-5xl">✍️</div>
                                <h3 className="text-3xl font-black text-white mb-4">Word Scramble</h3>
                                <p className="text-white/40 mb-8 max-w-sm">Unscramble AI-related terms before the timer hits zero!</p>
                                <button onClick={start} className="h-16 px-12 rounded-2xl bg-gradient-to-b from-green-500 to-green-700 text-white font-black text-2xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-3">
                                    START <div className="w-px h-6 bg-white/20" /> <span className="text-lg opacity-80">{cost}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-full max-w-md">
                                <div className="text-center mb-12">
                                    <div className="text-xs font-bold text-green-400 uppercase tracking-[0.2em] mb-4">Scrambled Word</div>
                                    <div className="text-5xl font-black text-white tracking-[0.3em] bg-white/5 py-8 rounded-[32px] border border-white/5 shadow-inner">
                                        {scrambled}
                                    </div>
                                </div>
                                <form onSubmit={handleSubmit} className="relative">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                                        placeholder="Type here..."
                                        autoFocus
                                        className="w-full h-16 bg-dark-950/80 border-2 border-white/10 rounded-2xl px-6 text-xl font-black text-white focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none transition-all placeholder:text-white/10 text-center"
                                    />
                                    <button type="submit" className="mt-4 w-full h-14 bg-white text-dark-950 font-black rounded-2xl hover:bg-green-50 active:scale-95 transition-all text-lg tracking-wider">
                                        SUBMIT ANSWER
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {status && (
                        <div className="mt-8 h-16 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`text-xl font-black uppercase tracking-wider ${status.includes('CORRECT') ? 'text-green-400' : 'text-red-400'}`}>
                                    {status}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <QuickGenerator characterId={characterId} characterName={characterName} character={character} onSpend={onPlay} gameContext="scramble" />

                <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-dark-900 shadow-2xl group">
                    {characterImage ? (
                        <>
                            <img src={characterImage} alt={characterName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-black text-white tracking-tight">{characterName}</h3>
                                <p className="text-xs text-white/40 uppercase font-black tracking-widest mt-1">Active Character</p>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-950/50 text-white/20 text-5xl">👤</div>
                    )}
                </div>
            </div>
        </div>
    );
}
