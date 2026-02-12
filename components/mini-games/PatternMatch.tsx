import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickGenerator } from './QuickGenerator';
import { CharacterDraft } from '@/lib/types';

type PatternMatchProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // Red, Blue, Green, Yellow

export function PatternMatch({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: PatternMatchProps) {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activePad, setActivePad] = useState<number | null>(null);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [started, setStarted] = useState(false);
    const [status, setStatus] = useState('');
    const [level, setLevel] = useState(0);

    const playPad = useCallback((index: number) => {
        setActivePad(index);
        setTimeout(() => setActivePad(null), 300);
    }, []);

    const showSequence = useCallback(async (seq: number[]) => {
        setIsShowingSequence(true);
        setStatus('Watch...');
        for (let i = 0; i < seq.length; i++) {
            await new Promise((r) => setTimeout(r, 600));
            playPad(seq[i]);
        }
        await new Promise((r) => setTimeout(r, 600));
        setIsShowingSequence(false);
        setStatus('Your Turn!');
    }, [playPad]);

    const start = async () => {
        setStatus('');
        const ok = await onPlay(cost);
        if (!ok) {
            setStatus('Not enough points!');
            return;
        }
        setStarted(true);
        setLevel(1);
        const first = Math.floor(Math.random() * 4);
        const newSeq = [first];
        setSequence(newSeq);
        setUserSequence([]);
        showSequence(newSeq);
    };

    const handlePadClick = (index: number) => {
        if (!started || isShowingSequence) return;

        playPad(index);
        const nextUserSeq = [...userSequence, index];
        const currentStep = userSequence.length;

        if (index !== sequence[currentStep]) {
            // Wrong!
            const reward = Math.max(0, (level - 1) * 20);
            setStatus(`WRONG! GAME OVER. +${reward} PTS`);
            if (reward > 0) onWin(reward);
            setStarted(false);
            return;
        }

        if (nextUserSeq.length === sequence.length) {
            // Level Complete!
            setStatus('GOOD!');
            setUserSequence([]);
            setLevel((l) => l + 1);
            const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
            setSequence(nextSeq);
            setTimeout(() => showSequence(nextSeq), 1000);
        } else {
            setUserSequence(nextUserSeq);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[600px]">
                {/* Game Console */}
                <div className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-blue-500/5 rounded-[40px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-1000" />

                    <div className="relative z-10 w-full flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => window.history.back()} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl">💿</div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight">PATTERN MATCH</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">Follow the sequence</p>
                            </div>
                        </div>
                        {started && (
                            <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 font-black text-sm text-white">
                                LEVEL: {level}
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center z-10">
                        {!started ? (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-8 shadow-xl shadow-blue-500/30 mx-auto text-5xl border-4 border-white/10">💿</div>
                                <h3 className="text-3xl font-black text-white mb-4">Pattern Match</h3>
                                <p className="text-white/40 mb-8 max-w-sm">Watch the pattern of colors and repeat it exactly!</p>
                                <button onClick={start} className="h-16 px-12 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-black text-2xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-3">
                                    PLAY NOW <div className="w-px h-6 bg-white/20" /> <span className="text-lg opacity-80">{cost}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6 w-full max-w-[320px]">
                                {COLORS.map((color, i) => (
                                    <motion.button
                                        key={i}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handlePadClick(i)}
                                        className="aspect-square rounded-3xl relative overflow-hidden shadow-2xl transition-all"
                                        style={{ backgroundColor: `${color}20`, border: `4px solid ${color}40` }}
                                    >
                                        <AnimatePresence>
                                            {activePad === i && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0"
                                                    style={{ backgroundColor: color, boxShadow: `0 0 40px ${color}` }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-4 h-4 rounded-full bg-white/10" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 h-16 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={status}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`text-xl font-black uppercase tracking-[0.2em] ${status.includes('WRONG') ? 'text-red-400' : 'text-blue-400'}`}
                            >
                                {status || (started ? (isShowingSequence ? 'Watch...' : 'Your Turn!') : 'Waiting...')}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <QuickGenerator characterId={characterId} characterName={characterName} character={character} onSpend={onPlay} gameContext="pattern" />

                <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-dark-900 shadow-2xl group">
                    {characterImage ? (
                        <>
                            <img src={characterImage} alt={characterName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 font-black text-white">
                                <h3 className="text-2xl tracking-tight">{characterName}</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Active Character</p>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-950/50 text-white/20 text-5xl font-black tracking-tighter">?</div>
                    )}
                </div>
            </div>
        </div>
    );
}
