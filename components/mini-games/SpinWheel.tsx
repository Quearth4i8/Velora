import React, { useEffect, useState, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { wallet } from '@/lib/wallet';
import { CharacterDraft } from '@/lib/types';
import { QuickGenerator } from './QuickGenerator';

type SpinResult = {
    label: string;
    points: number;
    net: number;
};

type SpinWheelProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const SPIN_PITY_MAX = 50;

export function SpinWheel({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: SpinWheelProps) {
    const spinSegments = useMemo(
        () => [
            { id: 'jackpot', label: 'Jackpot', weight: 1, points: 80, color: '#be185d' }, // Pink-700
            { id: 'rare', label: 'Rare', weight: 2, points: 35, color: '#db2777' },    // Pink-600
            { id: 'ok', label: 'OK', weight: 4, points: 15, color: '#e11d48' },      // Rose-600
            { id: 'tiny', label: 'Tiny', weight: 7, points: 5, color: '#ca8a04' },    // Yellow-600 (Darker)
            { id: 'miss', label: 'Miss', weight: 12, points: 0, color: '#1e293b' },    // Slate-800
            { id: 'tiny2', label: 'Tiny', weight: 7, points: 5, color: '#d97706' },   // Amber-600
            { id: 'miss2', label: 'Miss', weight: 12, points: 0, color: '#0f172a' },   // Slate-900
            { id: 'ok2', label: 'OK', weight: 4, points: 15, color: '#be123c' },      // Rose-700
        ],
        []
    );

    const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [gameStatus, setGameStatus] = useState<string>('');
    const [spinPity, setSpinPity] = useState(0);

    const controls = useAnimation();

    useEffect(() => {
        wallet.getSpinPity().then(setSpinPity);
    }, []);

    const pickWeightedIndex = (pityCount: number) => {
        const pity = Math.max(0, Math.min(SPIN_PITY_MAX - 1, Math.floor(pityCount)));
        const nextPullIndex = pity + 1;

        const bigIdxs = spinSegments
            .map((s, i) => ({ s, i }))
            .filter(({ s }) => s.points >= 35)
            .map(({ i }) => i);

        if (nextPullIndex >= SPIN_PITY_MAX && bigIdxs.length > 0) {
            const jackpotIdxs = spinSegments
                .map((s, i) => ({ s, i }))
                .filter(({ s }) => s.points >= 80)
                .map(({ i }) => i);
            const pool = (Math.random() < 0.25 && jackpotIdxs.length > 0) ? jackpotIdxs : bigIdxs;
            return pool[Math.floor(Math.random() * pool.length)] ?? 0;
        }

        const t = pity / (SPIN_PITY_MAX - 1);
        const ramp = Math.max(0, Math.min(1, (t - 0.3) / 0.7));

        const dynWeights = spinSegments.map((s) => {
            const w = Math.max(0, Math.floor(s.weight));
            if (s.points >= 80) return Math.max(0, Math.floor(w * (1 + ramp * 8)));
            if (s.points >= 35) return Math.max(0, Math.floor(w * (1 + ramp * 4)));
            if (s.points === 0) return Math.max(1, Math.floor(w * (1 - ramp * 0.5)));
            return w;
        });

        const total = dynWeights.reduce((sum, w) => sum + w, 0);
        const r = Math.random() * Math.max(1, total);
        let acc = 0;
        for (let i = 0; i < dynWeights.length; i++) {
            acc += dynWeights[i];
            if (r <= acc) return i;
        }
        return 0;
    };

    const spinWheel = async () => {
        if (isSpinning) return;

        setGameStatus('');
        setSpinResult(null);

        const idx = pickWeightedIndex(spinPity);
        const selected = spinSegments[idx];

        const segAngle = 360 / spinSegments.length;
        const targetAngle = -(idx * segAngle + segAngle / 2); // Center of segment to top

        const jitter = (Math.random() - 0.5) * (segAngle * 0.4); // Less jitter
        const extraSpins = 4 + Math.floor(Math.random() * 2); // Faster feel

        // Calculate final rotation
        const normalizedTarget = (targetAngle + 360) % 360;
        const currentMod = rotation % 360;
        let dist = normalizedTarget - currentMod;
        if (dist <= 0) dist += 360;

        const finalRotation = rotation + (360 * extraSpins) + dist + jitter;

        const ok = await onPlay(cost);
        if (!ok) {
            setGameStatus('NEED MORE POINTS');
            return;
        }

        const nextPity = Math.min(SPIN_PITY_MAX, Math.max(0, spinPity + 1));
        wallet.setSpinPity(nextPity).then(setSpinPity);

        setIsSpinning(true);

        await controls.start({
            rotate: finalRotation,
            transition: { duration: 3.5, ease: [0.2, 0.8, 0.3, 1] }
        });

        setRotation(finalRotation);

        const net = selected.points - cost;
        setSpinResult({ label: selected.label, points: selected.points, net });
        setGameStatus(selected.points > 0 ? `WIN +${selected.points}` : 'MISS');

        if (selected.points > 0) onWin(selected.points);
        if (selected.points >= 35) {
            wallet.setSpinPity(0).then(setSpinPity);
        }

        setIsSpinning(false);
    };

    const handleSpendForGenerator = async (amount: number) => {
        return await onPlay(amount);
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[550px]">

                {/* LEFT: Game Console */}
                <div className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col items-center justify-between shadow-2xl overflow-hidden group">
                    {/* Background FX */}
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-pink-500/5 rounded-[40px] -z-10 group-hover:bg-pink-500/10 transition-colors duration-1000" />

                    {/* Header */}
                    <div className="relative w-full flex items-center justify-between z-30 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                                <span className="text-xl">🎡</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight">SPIN & WIN</h2>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Jackpot: 80 PTS</div>
                            </div>
                        </div>

                        {/* Info Button */}
                        <div className="relative group/info z-50">
                            <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/60 transition-colors">
                                <span className="font-bold text-xs">?</span>
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 translate-y-2 group-hover/info:translate-y-0 text-left">
                                <div className="space-y-1">
                                    {spinSegments.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i).sort((a, b) => b.points - a.points).map(s => (
                                        <div key={s.label} className="flex justify-between text-[10px] text-white/80">
                                            <span>{s.label}</span>
                                            <span className="font-mono text-pink-400">+{s.points}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-white/30 text-center">Cost: {cost} pts</div>
                            </div>
                        </div>
                    </div>

                    {/* Wheel Area */}
                    <div className="relative z-0 flex-1 flex items-center justify-center w-full py-4">
                        {/* Pointer */}
                        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-8 bg-gradient-to-b from-white to-gray-300 clip-triangle shadow-lg transform -translate-y-1/2" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                        </div>

                        <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full p-2 bg-dark-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] border border-white/5">
                            {/* Outer Rim Lights */}
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 opacity-50 animate-[spin_60s_linear_infinite]" />

                            <motion.div
                                className="w-full h-full rounded-full overflow-hidden relative shadow-2xl border-4 border-dark-900"
                                animate={controls}
                                initial={{ rotate: 0 }}
                                style={{
                                    background: `conic-gradient(${spinSegments
                                        .map((s, i) => `${s.color} ${(i / spinSegments.length) * 100}% ${((i + 1) / spinSegments.length) * 100}%`)
                                        .join(', ')})`
                                }}
                            >
                                {/* Segments Text */}
                                {spinSegments.map((s, i) => {
                                    const segAngle = 360 / spinSegments.length;
                                    const angle = i * segAngle + segAngle / 2;
                                    return (
                                        <div
                                            key={i}
                                            className="absolute left-1/2 top-1/2 w-0 h-0"
                                            style={{ transform: `rotate(${angle}deg)` }}
                                        >
                                            <div className="absolute -translate-x-1/2 -translate-y-[120px] sm:-translate-y-[145px] w-16 text-center">
                                                <span className="text-white text-[10px] sm:text-xs font-black uppercase drop-shadow-sm rotate-180 block">
                                                    {s.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Center Nut */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-dark-800 to-dark-950 border-2 border-white/10 shadow-lg flex items-center justify-center z-20">
                                    <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="relative z-20 w-full mt-4 flex items-center gap-4">
                        {/* Status Display */}
                        <div className="flex-1 h-14 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center px-4 overflow-hidden relative">
                            <AnimatePresence mode='wait'>
                                {gameStatus ? (
                                    <motion.div
                                        key="status"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        className={`font-black text-lg sm:text-xl uppercase tracking-wider ${gameStatus.includes('WIN') ? 'text-green-400 drop-shadow-sm' : 'text-red-400'}`}
                                    >
                                        {gameStatus}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-white/20 text-xs font-bold uppercase tracking-widest"
                                    >
                                        Ready to Spin
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Spin Button */}
                        <button
                            onClick={spinWheel}
                            disabled={isSpinning}
                            className="h-14 px-8 rounded-2xl bg-gradient-to-b from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600 text-white font-black text-xl shadow-[0_4px_0_rgb(157,23,77)] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:translate-y-[4px] transition-all flex items-center gap-2 group/btn"
                        >
                            <span>SPIN</span>
                            <div className="w-px h-6 bg-white/20 mx-1" />
                            <span className="text-sm font-bold opacity-80">{cost}</span>
                        </button>
                    </div>

                    {/* Pity Bar (Subtle) */}
                    <div className="relative z-10 w-full mt-4 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="text-[9px] font-bold text-white/40 uppercase">Luck Meter</div>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-pink-500 to-yellow-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(Math.min(spinPity, SPIN_PITY_MAX) / SPIN_PITY_MAX) * 100}%` }}
                            />
                        </div>
                        <div className="text-[9px] font-mono text-white/40">{spinPity}/{SPIN_PITY_MAX}</div>
                    </div>

                </div>

                {/* MIDDLE: Quick Generator */}
                <QuickGenerator
                    characterId={characterId}
                    characterName={characterName}
                    character={character}
                    onSpend={handleSpendForGenerator}
                    gameContext="spin"
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
