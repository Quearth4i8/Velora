import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickGenerator } from './QuickGenerator';
import { CharacterDraft } from '@/lib/types';

type GuessThePromptProps = {
    onPlay: (cost: number) => Promise<boolean>;
    onWin: (points: number) => void;
    cost: number;
    characterImage?: string;
    characterName?: string;
    characterId?: string;
    character?: CharacterDraft | null;
};

const QUESTION_TIME = 20;
const TOTAL_QUESTIONS = 6;

export function GuessThePrompt({ onPlay, onWin, cost, characterImage, characterName, characterId, character }: GuessThePromptProps) {
    const allQuestions = useMemo(() => {
        return [
            {
                id: 'q1',
                question: 'Which negative prompt helps prevent anatomical errors?',
                options: ['bad anatomy', 'low quality', 'blurry', 'watermark'],
                answer: 'bad anatomy',
                difficulty: 'Easy',
            },
            {
                id: 'q2',
                question: 'What does (prompt:1.3) syntax do?',
                options: ['Increases weight', 'Decreases weight', 'Adds style', 'Removes tag'],
                answer: 'Increases weight',
                difficulty: 'Medium',
            },
            {
                id: 'q3',
                question: 'Best sampler for photorealistic images?',
                options: ['DPM++ 2M Karras', 'Euler a', 'DDIM', 'LMS'],
                answer: 'DPM++ 2M Karras',
                difficulty: 'Hard',
            },
            {
                id: 'q4',
                question: 'Which tag enforces single character composition?',
                options: ['solo', '1girl', 'single character', 'alone'],
                answer: 'solo',
                difficulty: 'Easy',
            },
            {
                id: 'q5',
                question: 'What CFG scale range is best for creative freedom?',
                options: ['3-5', '7-9', '12-15', '20+'],
                answer: '7-9',
                difficulty: 'Medium',
            },
            {
                id: 'q6',
                question: 'Which prevents multiple subjects in negative prompt?',
                options: ['multiple girls', 'group', 'crowd', 'All of the above'],
                answer: 'All of the above',
                difficulty: 'Medium',
            },
            {
                id: 'q7',
                question: 'Best lighting tag for dramatic portraits?',
                options: ['cinematic lighting', 'soft light', 'natural light', 'studio lighting'],
                answer: 'cinematic lighting',
                difficulty: 'Easy',
            },
            {
                id: 'q8',
                question: 'What does "score_9, score_8_up" indicate?',
                options: ['Quality tags for Pony models', 'Version number', 'Resolution', 'Seed value'],
                answer: 'Quality tags for Pony models',
                difficulty: 'Hard',
            },
        ];
    }, []);

    const [selectedQuestions, setSelectedQuestions] = useState<typeof allQuestions>([]);
    const [guessIndex, setGuessIndex] = useState(0);
    const [guessPicked, setGuessPicked] = useState<string>('');
    const [guessStatus, setGuessStatus] = useState<string>('');
    const [guessFinished, setGuessFinished] = useState(false);
    const [guessStarted, setGuessStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [totalTimeBonus, setTotalTimeBonus] = useState(0);

    const startGuess = async () => {
        setGuessStatus('');
        const ok = await onPlay(cost);
        if (!ok) {
            setGuessStatus(`Not enough points!`);
            return;
        }

        // Shuffle and select questions
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, TOTAL_QUESTIONS).map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));

        setSelectedQuestions(selected);
        setGuessStarted(true);
        setGuessIndex(0);
        setGuessPicked('');
        setGuessFinished(false);
        setTimeLeft(QUESTION_TIME);
        setTotalTimeBonus(0);
    };

    const currentGuess = selectedQuestions[guessIndex];

    // Timer countdown
    useEffect(() => {
        if (!guessStarted || guessFinished || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Time's up - wrong answer
                    setGuessStatus('TIME UP! GAME OVER');
                    setGuessFinished(true);
                    setGuessStarted(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [guessStarted, guessFinished, timeLeft]);

    const submitGuess = () => {
        if (!currentGuess || guessFinished) return;
        if (!guessStarted) {
            setGuessStatus('Press Start first.');
            return;
        }
        if (!guessPicked) {
            setGuessStatus('Pick an answer.');
            return;
        }

        if (guessPicked === currentGuess.answer) {
            const timeBonus = timeLeft;
            setTotalTimeBonus(prev => prev + timeBonus);

            if (guessIndex >= selectedQuestions.length - 1) {
                // Win!
                const baseReward = 100;
                const speedBonus = totalTimeBonus + timeBonus;
                const perfectBonus = selectedQuestions.length === TOTAL_QUESTIONS ? 50 : 0;
                const totalReward = baseReward + speedBonus + perfectBonus;

                setGuessStatus(`PERFECT! +${totalReward} PTS`);
                setGuessFinished(true);
                onWin(totalReward);
                setGuessStarted(false);
                return;
            }

            setGuessStatus('CORRECT!');
            window.setTimeout(() => {
                setGuessIndex((prev) => prev + 1);
                setGuessPicked('');
                setGuessStatus('');
                setTimeLeft(QUESTION_TIME);
            }, 450);
            return;
        }

        // Wrong answer - game over
        setGuessStatus('WRONG! GAME OVER');
        setGuessFinished(true);
        setGuessStarted(false);
    };

    const handleSpendForGenerator = async (amount: number) => {
        return await onPlay(amount);
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr] gap-6 lg:h-[600px]">

                {/* LEFT: Quiz Console */}
                <div className="relative bg-dark-900 border border-white/5 rounded-[40px] p-6 lg:p-8 flex flex-col shadow-2xl overflow-hidden group">
                    {/* Background FX */}
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-black pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute -inset-1 blur-3xl bg-blue-500/5 rounded-[40px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-1000" />

                    {/* Header */}
                    <div className="relative w-full flex items-center justify-between z-30 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <span className="text-xl">🧩</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none tracking-tight">GUESS THE PROMPT</h2>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Answer Correctly</div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2">
                            {guessStarted && (
                                <>
                                    {/* Timer */}
                                    <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${timeLeft <= 5 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-white/80'
                                        }`}>
                                        ⏱ {timeLeft}s
                                    </div>

                                    {/* Progress */}
                                    <div className="flex gap-1">
                                        {selectedQuestions.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-2 w-6 rounded-full transition-colors ${i < guessIndex ? 'bg-green-500' : i === guessIndex ? 'bg-blue-500' : 'bg-white/10'
                                                    }`}
                                            />
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
                                        <div>• {TOTAL_QUESTIONS} questions, {QUESTION_TIME}s each</div>
                                        <div>• One wrong = game over</div>
                                        <div>• Speed bonus: +1pt/sec</div>
                                        <div>• Perfect bonus: +50pts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Game Area */}
                    <div className="relative flex-1 flex flex-col z-10">
                        {!guessStarted ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                    <span className="text-4xl">🧩</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Test Your Knowledge</h3>
                                <p className="text-white/50 text-sm mb-1">{TOTAL_QUESTIONS} prompting questions</p>
                                <p className="text-white/30 text-xs mb-6">{QUESTION_TIME}s each • One strike out</p>
                                <button
                                    onClick={startGuess}
                                    className="h-14 px-8 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black text-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-2"
                                >
                                    <span>START QUIZ</span>
                                    <div className="w-px h-6 bg-white/20 mx-1" />
                                    <span className="text-sm font-bold opacity-80">{cost}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                {/* Question */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                            Question {guessIndex + 1}/{selectedQuestions.length}
                                        </div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded ${currentGuess?.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                            currentGuess?.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            {currentGuess?.difficulty}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white leading-snug">
                                        {currentGuess?.question}
                                    </h3>
                                </div>

                                {/* Answer Options */}
                                <div className="grid grid-cols-1 gap-3 flex-1">
                                    {currentGuess?.options.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setGuessPicked(opt)}
                                            disabled={guessFinished}
                                            className={`relative px-5 py-4 rounded-xl border text-left text-sm font-bold transition-all overflow-hidden ${guessPicked === opt
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                                                : 'bg-dark-800/50 border-white/10 text-white/70 hover:bg-dark-800 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                                }`}
                                        >
                                            <span className="relative z-10">{opt}</span>
                                            {guessPicked === opt && (
                                                <div className="absolute inset-0 bg-white/10 z-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status & Action Bar */}
                    {guessStarted && (
                        <div className="relative z-20 w-full mt-4">
                            <div className="flex items-center gap-3">
                                {/* Status Display */}
                                <div className="flex-1 h-12 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center px-4 overflow-hidden">
                                    <AnimatePresence mode='wait'>
                                        {guessStatus ? (
                                            <motion.div
                                                key="status"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                className={`font-black text-base uppercase tracking-wider ${guessStatus.includes('CORRECT') || guessStatus.includes('PERFECT')
                                                    ? 'text-green-400'
                                                    : guessStatus.includes('WRONG') || guessStatus.includes('TIME UP')
                                                        ? 'text-red-400'
                                                        : 'text-yellow-400'
                                                    }`}
                                            >
                                                {guessStatus}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-white/20 text-xs font-bold uppercase tracking-widest"
                                            >
                                                Select Your Answer
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Button */}
                                {!guessFinished ? (
                                    <button
                                        type="button"
                                        onClick={submitGuess}
                                        disabled={!guessPicked}
                                        className="h-12 px-6 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black text-lg shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:translate-y-[4px] transition-all"
                                    >
                                        SUBMIT
                                    </button>
                                ) : (
                                    <button
                                        onClick={startGuess}
                                        className="h-12 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 transition-colors text-sm"
                                    >
                                        Play Again
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* MIDDLE: Quick Generator */}
                <QuickGenerator
                    characterId={characterId}
                    characterName={characterName}
                    character={character}
                    onSpend={handleSpendForGenerator}
                    gameContext="guess"
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
