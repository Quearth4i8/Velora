import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { CharacterDraft, CharacterStyle, AIModel } from '@/lib/types';
import { Sparkles, Wand2, Lock, Check, RefreshCw, X } from 'lucide-react'; // Need to insure icons exist or use emoji/svg

type GeneratorOptions = {
    isLewd: boolean;
    isHighQuality: boolean;
    prompt: string;
};

type GameContext = 'spin' | 'memory' | 'guess' | 'scramble' | 'pattern' | 'reflex';

type QuickGeneratorProps = {
    characterId?: string;
    characterName?: string;
    character?: CharacterDraft | null;
    onSpend: (amount: number) => Promise<boolean>;
    baseCost?: number;
    gameContext?: GameContext;
};

const COSTS = {
    BASE: 50,
    LEWD: 50,
    HIGH_QUALITY: 30,
    PROMPT: 20
};

export function QuickGenerator({ characterId, characterName, character, onSpend, baseCost = 50, gameContext }: QuickGeneratorProps) {
    const [options, setOptions] = useState<GeneratorOptions>({
        isLewd: false,
        isHighQuality: false,
        prompt: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const totalCost = COSTS.BASE
        + (options.isLewd ? COSTS.LEWD : 0)
        + (options.isHighQuality ? COSTS.HIGH_QUALITY : 0)
        + (options.prompt ? COSTS.PROMPT : 0);

    const handleGenerate = async () => {
        if (!characterId) {
            setError("No character selected");
            return;
        }

        setError(null);

        // 1. Spend Points
        const paid = await onSpend(totalCost);
        if (!paid) {
            setError(`Not enough points! Need ${totalCost}`);
            return;
        }

        setIsGenerating(true);

        try {
            // Dynamic import to match GalleryPage pattern
            const { automatic1111API, buildCharacterBasePrompts } = await import('@/lib/automatic1111');

            // Check connection
            const isConnected = await automatic1111API.checkConnection();
            if (!isConnected) throw new Error("AI Service unavailable");

            // Build Base Prompt from Character Data
            let finalPrompt = '';
            let finalNegativePrompt = 'low quality, worst quality, bad anatomy, text, watermark';
            let resolvedModel = options.isHighQuality ? AIModel.WAI_ILLUSTRIOUS_SDXL : AIModel.MOE_FUSSION_V1_5_0_Z_VZ;
            let style = CharacterStyle.ANIME;

            if (character) {
                const base = buildCharacterBasePrompts(character);
                finalPrompt = base.prompt;
                finalNegativePrompt = base.negativePrompt;

                // Prefer character's settings
                if (character.generation?.style) style = character.generation.style;

                // Resolve model based on style/character preferences
                // We let the QuickGen options override high quality model choice if checked,
                // otherwise use character's preferred model or style default.
                if (options.isHighQuality) {
                    resolvedModel = AIModel.WAI_ILLUSTRIOUS_SDXL; // High quality always uses this
                } else if (character.generation?.model) {
                    resolvedModel = character.generation.model;
                } else {
                    resolvedModel = automatic1111API.getModelForStyle(style);
                }
            } else {
                // Fallback if no character data draft available (should be rare in V2)
                finalPrompt = `1girl, solo, ${characterName || 'character'}`;
                resolvedModel = automatic1111API.getModelForStyle(CharacterStyle.ANIME);
            }

            // Add Game-Themed Context
            if (gameContext) {
                const gameThemes = {
                    spin: "casino theme, slot machine, playing cards, dice, poker chips, neon lights, gambling aesthetic, lucky symbols",
                    memory: "puzzle theme, brain teaser, concentration, memory game aesthetic, card game, matching symbols, thinking pose, intellectual",
                    guess: "quiz theme, knowledge, learning, studying, book, glasses, teacher aesthetic, smart, trivia game",
                    scramble: "word puzzle, alphabetical letters, vocabulary, writer, typewriter aesthetic, pen and paper, library background, focused expression",
                    pattern: "glowing neon pads, rhythmic sequence, electronic music aesthetic, cyberpunk interface, colorful lights, digital pattern, memory recall",
                    reflex: "speed, rapid reaction, energy, sparks, lightning, action pose, dynamic composition, fast-paced, alert expression"
                };
                const themePrompt = gameThemes[gameContext];
                if (themePrompt) {
                    finalPrompt += `, ${themePrompt}`;
                }
            }

            // Append User Prompt
            if (options.prompt) {
                finalPrompt += `, ${options.prompt}`;
            }

            // Extreme Lewd Logic
            if (options.isLewd) {
                const extremeTags = "nsfw, explicit, lewd, uncensored, (explicit content:1.2), (genitals:1.2), (sex:1.2), nude, naked, pussy, nipples, areola, (spread legs:1.1)";
                finalPrompt += `, ${extremeTags}`;
            } else {
                // SFW safeguards if not lewd
                finalNegativePrompt += ", nsfw, nude, naked, nipples, genital";
            }

            // High Quality Tags
            if (options.isHighQuality) {
                finalPrompt += ", (masterpiece:1.2), (best quality:1.2), (highres:1.1), 8k";
            }

            const payload = {
                prompt: finalPrompt,
                negative_prompt: finalNegativePrompt,
                width: 832,
                height: 1216,
                steps: options.isHighQuality ? 40 : 25,
                cfg_scale: 7,
                sampler_name: "DPM++ 2M Karras",
                model_name: resolvedModel, // automatic1111API might need actual switch
                override_settings: {
                    sd_model_checkpoint: resolvedModel,
                },
            };

            await automatic1111API.switchModel(resolvedModel);

            const response = await fetch('/api/automatic1111/txt2img', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload }),
            });

            if (!response.ok) {
                const details = await response.text().catch(() => '');
                console.error('Automatic1111 txt2img error:', {
                    status: response.status,
                    statusText: response.statusText,
                    details,
                });
                throw new Error(`Generation failed (${response.status}): ${details || response.statusText}`);
            }
            const result = await response.json();
            if (!result.images?.length) throw new Error("No image returned");

            const base64 = result.images[0];
            setGeneratedImage(`data:image/png;base64,${base64}`);

            // Save to Gallery
            await characterAPI.addCharacterImage(
                characterId,
                base64,
                finalPrompt,
                resolvedModel,
                style
            );

        } catch (e: any) {
            console.error(e?.stack || e);
            setError(e.message || "Something went wrong");
            // Refund? Complex. For now assume user accepts risk or we handle it.
            // Ideally we shouldn't charge if it fails, but we charged first.
            // TODO: partial refund logic if desired.
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative h-full min-h-[400px] lg:min-h-auto rounded-[40px] overflow-hidden border border-white/5 bg-dark-900 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Sparkles size={16} />
                    </div>
                    <h3 className="text-lg font-black text-white">Quick Gen</h3>
                </div>
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
                    AI Studio
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">

                {generatedImage ? (
                    <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 group">
                        <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button onClick={() => setGeneratedImage(null)} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <X size={20} />
                            </button>
                            <a href={generatedImage} download="velora-gen.png" className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                                <Wand2 size={20} />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Options */}
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-950/50 border border-white/5 cursor-pointer hover:border-pink-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${options.isLewd ? 'bg-pink-500 border-pink-500' : 'border-white/20'}`}>
                                        {options.isLewd && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-white">Naughty Mode</span>
                                </div>
                                <span className="text-xs font-mono text-pink-400">+{COSTS.LEWD}</span>
                                <input type="checkbox" className="hidden" checked={options.isLewd} onChange={e => setOptions({ ...options, isLewd: e.target.checked })} />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-950/50 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${options.isHighQuality ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`}>
                                        {options.isHighQuality && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-white">High Quality</span>
                                </div>
                                <span className="text-xs font-mono text-purple-400">+{COSTS.HIGH_QUALITY}</span>
                                <input type="checkbox" className="hidden" checked={options.isHighQuality} onChange={e => setOptions({ ...options, isHighQuality: e.target.checked })} />
                            </label>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-white/50">
                                <span>Extra Details</span>
                                <span className="text-blue-400">+{COSTS.PROMPT}</span>
                            </div>
                            <textarea
                                value={options.prompt}
                                onChange={e => setOptions({ ...options, prompt: e.target.value })}
                                placeholder="E.g. holding a weapon, cyberpunk lighting..."
                                className="w-full bg-dark-950/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none h-20"
                            />
                        </div>
                    </div>
                )}

                {/* Footer / Action */}
                <div className="mt-auto">
                    {error && (
                        <div className="mb-4 text-xs font-bold text-red-400 text-center bg-red-500/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!generatedImage && (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !characterId}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 size={20} />
                                    <span>Create ({totalCost})</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
