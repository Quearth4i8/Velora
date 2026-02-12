import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickGenerator } from './QuickGenerator';
import { CharacterDraft } from '@/lib/types';

type ReflexTestProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const ROUNDS = 5;

export function ReflexTest({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: ReflexTestProps) {
    const [started, setStarted] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [round, setRound] = useState(0);
    const [times, setTimes] = useState<number[]>([]);
    const [status, setStatus] = useState('');
    const [targetVisible, setTargetVisible] = useState(false);
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const spawnTarget = useCallback(() => {
        setTargetPos({
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
        });
        setTargetVisible(true);
        startTimeRef.current = performance.now();
    }, []);

    const startRound = useCallback(() => {
        setTargetVisible(false);
        setWaiting(true);
        setStatus('Wait for it...');
        const delay = 1000 + Math.random() * 3000;
        timerRef.current = setTimeout(() => {
            setWaiting(false);
            spawnTarget();
        }, delay);
    }, [spawnTarget]);

    const start = async () => {
        setStatus('');
        const ok = await onPlay(cost);
        if (!ok) {
            setStatus('Not enough points!');
            return;
        }
        setStarted(true);
        setRound(1);
        setTimes([]);
        startRound();
    };

    const handleTargetClick = () => {
        if (!targetVisible) return;

        const duration = Math.round(performance.now() - startTimeRef.current);
        const newTimes = [...times, duration];
        setTimes(newTimes);
        setTargetVisible(false);

        if (round >= ROUNDS) {
            const avg = newTimes.reduce((a, b) => a + b, 0) / ROUNDS;
            let reward = 0;
            if (avg < 250) reward = 100;
            else if (avg < 350) reward = 70;
            else if (avg < 500) reward = 40;
            else reward = 20;

            setStatus(`FINISHED! AVG: ${Math.round(avg)}ms. +${reward} PTS`);
            onWin(reward);
            setStarted(false);
        } else {
            setRound((r) => r + 1);
            setStatus(`ROUND ${round}: ${duration}ms!`);
            setTimeout(startRound, 1000);
        }
    };

    const handleEarlyClick = () => {
        if (waiting) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setWaiting(false);
            setStatus('TOO EARLY! GAME OVER');
            setStarted(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[600px]">
                {/* Game Console */}
                <div
                    className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col shadow-2xl overflow-hidden group cursor-crosshair"
                    onClick={handleEarlyClick}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-red-500/5 rounded-[40px] -z-10 group-hover:bg-red-500/10 transition-colors duration-1000" />

                    <div className="relative z-10 w-full flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => window.history.back()} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 transition-colors pointer-events-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl font-bold">⚡</div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight uppercase">Reflex Test</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">Click the target fast!</p>
                            </div>
                        </div>
                        {started && (
                            <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 font-black text-sm text-white">
                                ROUND {round}/{ROUNDS}
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center z-10 overflow-hidden rounded-[32px] bg-dark-950/50 border border-white/5 shadow-inner">
                        {!started ? (
                            <div className="text-center py-12 pointer-events-auto">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-8 shadow-xl shadow-red-500/30 mx-auto text-5xl">⚡</div>
                                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Reflex Test</h3>
                                <p className="text-white/40 mb-8 max-w-xs mx-auto">Click the targets as soon as they appear. Don't click too early!</p>
                                <button onClick={start} className="h-16 px-12 rounded-2xl bg-gradient-to-b from-red-500 to-red-700 text-white font-black text-2xl shadow-[0_4px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-3">
                                    START TEST <div className="w-px h-6 bg-white/20" /> <span className="text-lg opacity-80">{cost}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="absolute inset-0">
                                <AnimatePresence>
                                    {targetVisible && (
                                        <motion.button
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 1.5, opacity: 0 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTargetClick();
                                            }}
                                            className="absolute w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] border-4 border-white pointer-events-auto"
                                            style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)' }}
                                        >
                                            <div className="w-12 h-12 rounded-full border-2 border-white/50" />
                                            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                                {waiting && (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                                        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
                                        <div className="text-white/20 font-black text-lg tracking-[0.3em] uppercase">Wait for target...</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 h-16 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={status}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className={`text-xl font-black uppercase tracking-wider ${status.includes('TOO EARLY') ? 'text-red-500' : status.includes('FINISHED') ? 'text-green-400' : 'text-white/60'}`}
                            >
                                {status || 'Click the red target!'}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <QuickGenerator characterId={characterId} characterName={characterName} character={character} onSpend={onPlay} gameContext="reflex" />

                <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-dark-900 shadow-2xl group">
                    {characterImage ? (
                        <>
                            <img src={characterImage} alt={characterName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-black text-white tracking-tighter">{characterName}</h3>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mt-1">Active Character</p>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-950/50 text-white/20 text-6xl font-black">?</div>
                    )}
                </div>
            </div>
        </div>
    );
}
