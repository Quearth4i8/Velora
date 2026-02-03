'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import type { CharacterDraft } from '@/lib/types';
import { ENCOUNTER_SCENARIOS } from '@/data/encounters';
import type { EncounterIntensity, EncounterScenario } from '@/lib/encounters';

export default function EncountersPage() {
  const router = useRouter();
  const [step, setStep] = useState<'scenario' | 'character' | 'options'>('scenario');

  const scenarioImageById: Record<string, string> = {
    'midnight-hotel-lobby': '/encounters/hotel-lobby.jpg',
    'after-hours-bookshop': '/encounters/bookshop.jpg',
    'stormy-cabin': '/encounters/stormy-cabin.jpg',
    'club-vip-booth': '/encounters/club-vip.jpg',
    'late-night-train-platform': '/encounters/train-plateform.jpg',
    'quiet-museum-gallery': '/encounters/museum-gallery.jpg',
  };

  const [selectedScenario, setSelectedScenario] = useState<EncounterScenario | null>(null);
  const [characters, setCharacters] = useState<CharacterDraft[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDraft | null>(null);

  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [intensity, setIntensity] = useState<EncounterIntensity>('medium');

  const suggestedMoods = useMemo(() => selectedScenario?.suggestedMoods || [], [selectedScenario]);
  const suggestedLocations = useMemo(() => selectedScenario?.suggestedLocations || [], [selectedScenario]);

  useEffect(() => {
    if (step !== 'character') return;

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

        setCharacters(next.filter((c) => !c.isGalleryOnly));
      } finally {
        setIsLoadingCharacters(false);
      }
    };

    load();
  }, [step]);

  const startEncounter = () => {
    if (!selectedScenario?.id || !selectedCharacter?.id) return;

    const params = new URLSearchParams();
    params.set('scenario', selectedScenario.id);
    params.set('character', selectedCharacter.id);

    if (mood.trim()) params.set('mood', mood.trim());
    if (location.trim()) params.set('location', location.trim());
    if (intensity) params.set('intensity', intensity);

    router.push(`/encounters/chat?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="w-full px-4 sm:px-8 lg:px-12 pt-10 pb-16">
          <div className="w-full max-w-[1600px] mx-auto">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-dark-950/20 backdrop-blur-xl mb-8">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-pink-600/10 blur-[90px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-purple-500/10 blur-[100px] rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
              </div>

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/80">
                      Story Mode
                      <span className="h-1 w-1 rounded-full bg-pink-400" />
                      Realism-forward
                    </div>
                    <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                      Encounters
                    </h1>
                    <p className="text-dark-300 mt-2 max-w-3xl">
                      Pick a curated scene, choose a character, then chat with stricter realism and slower pacing.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                      onClick={() => router.push('/encounters/history')}
                    >
                      History
                    </button>

                    <button
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 text-white font-extrabold transition-colors shadow-lg shadow-pink-500/20"
                      onClick={() => {
                        setStep('scenario');
                        setSelectedScenario(null);
                        setSelectedCharacter(null);
                        setMood('');
                        setLocation('');
                        setIntensity('medium');
                      }}
                    >
                      Start New
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    className={`group relative rounded-2xl border px-4 py-3 text-left transition-colors ${step === 'scenario'
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    onClick={() => {
                      setStep('scenario');
                      setSelectedScenario(null);
                      setSelectedCharacter(null);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-white/50 font-semibold">Step 1</div>
                        <div className="text-sm font-bold text-white">Scenario</div>
                      </div>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center text-sm font-extrabold ${step === 'scenario'
                        ? 'border-pink-500/50 bg-pink-500/10 text-pink-200'
                        : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        1
                      </div>
                    </div>
                  </button>

                  <button
                    className={`group relative rounded-2xl border px-4 py-3 text-left transition-colors ${step === 'character'
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    onClick={() => {
                      if (!selectedScenario) return;
                      setStep('character');
                    }}
                    disabled={!selectedScenario}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-white/50 font-semibold">Step 2</div>
                        <div className="text-sm font-bold text-white">Character</div>
                      </div>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center text-sm font-extrabold ${step === 'character'
                        ? 'border-pink-500/50 bg-pink-500/10 text-pink-200'
                        : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        2
                      </div>
                    </div>
                  </button>

                  <button
                    className={`group relative rounded-2xl border px-4 py-3 text-left transition-colors ${step === 'options'
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    onClick={() => {
                      if (!selectedScenario || !selectedCharacter) return;
                      setStep('options');
                    }}
                    disabled={!selectedScenario || !selectedCharacter}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-white/50 font-semibold">Step 3</div>
                        <div className="text-sm font-bold text-white">Options</div>
                      </div>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center text-sm font-extrabold ${step === 'options'
                        ? 'border-pink-500/50 bg-pink-500/10 text-pink-200'
                        : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        3
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div>
              {step === 'scenario' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {ENCOUNTER_SCENARIOS.map((scenario) => {
                      const selected = selectedScenario?.id === scenario.id;
                      const imageSrc = scenarioImageById[scenario.id];
                      return (
                        <button
                          key={scenario.id}
                          onClick={() => {
                            setSelectedScenario(scenario);
                            setSelectedCharacter(null);
                            setMood('');
                            setLocation('');
                            setIntensity('medium');
                            setStep('character');
                          }}
                          className={`group relative w-full text-left rounded-[28px] border overflow-hidden transition-all duration-300 ${selected
                            ? 'border-pink-500/60 bg-pink-500/10 ring-2 ring-pink-500/15'
                            : 'border-white/10 bg-dark-950/10 hover:bg-dark-950/20 hover:border-pink-500/30'
                            }`}
                        >
                          <div className="relative">
                            {imageSrc ? (
                              <div className="relative h-44 sm:h-52 overflow-hidden">
                                <div
                                  className="absolute inset-0 bg-center bg-cover opacity-80 transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.03]"
                                  style={{ backgroundImage: `url(${imageSrc})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
                              </div>
                            ) : (
                              <div className="h-44 sm:h-52 bg-gradient-to-br from-dark-800 to-dark-950" />
                            )}

                            <div className="p-6">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                    {scenario.title}
                                  </h3>
                                  <p className="text-dark-300 mt-2">{scenario.shortDescription}</p>
                                </div>
                                <span className="shrink-0 text-[10px] px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-white/60">
                                  {scenario.id}
                                </span>
                              </div>

                              <div className="mt-5">
                                <div className="text-xs text-white/50 font-semibold">Narrative intent</div>
                                <div className="text-sm text-dark-200 mt-1">{scenario.narrativeIntent}</div>
                              </div>

                              <div className="mt-5">
                                <div className="text-xs text-white/50 font-semibold">AI rules (preview)</div>
                                <div className="mt-2 space-y-1">
                                  {scenario.behavioralRules.slice(0, 2).map((r) => (
                                    <div key={r} className="text-sm text-dark-200">- {r}</div>
                                  ))}
                                  {scenario.behavioralRules.length > 2 && (
                                    <div className="text-xs text-dark-500">+ {scenario.behavioralRules.length - 2} more</div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-pink-200/90 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.45)]" />
                                Choose this scenario
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {step === 'character' && selectedScenario && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs text-white/50 font-semibold">Selected scenario</div>
                      <div className="text-xl font-extrabold text-white mt-1">{selectedScenario.title}</div>
                      <div className="text-dark-300 mt-1 max-w-3xl">{selectedScenario.shortDescription}</div>
                    </div>
                    <button
                      className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                      onClick={() => setStep('scenario')}
                    >
                      Change
                    </button>
                  </div>

                  {isLoadingCharacters ? (
                    <div className="py-16 text-center text-dark-400">Loading characters...</div>
                  ) : characters.length === 0 ? (
                    <div className="py-16 text-center rounded-[28px] border border-white/10 bg-dark-950/10">
                      <div className="text-dark-200 font-semibold">No characters found.</div>
                      <div className="text-dark-500 text-sm mt-2">Create a character first, then come back to start an Encounter.</div>
                      <button
                        className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-extrabold"
                        onClick={() => router.push('/create')}
                      >
                        Create Character
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                      {characters.map((c) => {
                        const selected = selectedCharacter?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCharacter(c);
                              setStep('options');
                            }}
                            className={`group text-left rounded-[24px] overflow-hidden border transition-all duration-200 ${selected
                              ? 'border-pink-500/60 bg-pink-500/10 ring-2 ring-pink-500/15'
                              : 'border-white/10 bg-dark-950/10 hover:bg-dark-950/20 hover:border-pink-500/30'
                              }`}
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-dark-800 to-dark-950">
                              {c.generation?.generatedImage ? (
                                <img
                                  src={c.generation.generatedImage}
                                  alt={c.name || 'Character'}
                                  className="w-full h-full object-cover opacity-95 group-hover:scale-[1.02] transition-transform duration-500"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-dark-500">No image</div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="text-white font-extrabold text-lg leading-tight truncate">
                                  {c.name || 'Unnamed'}
                                </div>
                                <div className="text-xs text-pink-300 capitalize mt-0.5">
                                  {c.characterType === 'special' ? 'Special' : 'Custom'}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {step === 'options' && selectedScenario && selectedCharacter && (
                <div className="grid grid-cols-1 2xl:grid-cols-[1fr_520px] gap-6">
                    <div className="rounded-[28px] border border-white/10 bg-dark-950/10 backdrop-blur-xl p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="text-xs text-white/50 font-semibold">Scenario</div>
                          <div className="text-2xl font-extrabold text-white mt-1">{selectedScenario.title}</div>
                          <div className="text-dark-300 mt-2">{selectedScenario.shortDescription}</div>
                        </div>
                        <button
                          className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                          onClick={() => setStep('scenario')}
                        >
                          Change
                        </button>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <div className="text-xs text-white/50 font-semibold">Character</div>
                          <div className="text-lg font-extrabold text-white mt-1">{selectedCharacter.name || 'Unnamed'}</div>
                        </div>
                        <button
                          className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                          onClick={() => setStep('character')}
                        >
                          Change
                        </button>
                      </div>

                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <div className="text-sm font-extrabold text-white mb-2">Mood (optional)</div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {suggestedMoods.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMood(m)}
                                className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-colors ${mood === m
                                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                  }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                          <input
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            placeholder="Type a mood..."
                            className="w-full px-4 py-3 rounded-2xl bg-dark-950/40 border border-white/10 text-white focus:ring-2 focus:ring-pink-500/60 focus:border-pink-500/60"
                          />
                        </div>

                        <div>
                          <div className="text-sm font-extrabold text-white mb-2">Location (optional)</div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {suggestedLocations.map((l) => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setLocation(l)}
                                className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-colors ${location === l
                                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                  }`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                          <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Type a location..."
                            className="w-full px-4 py-3 rounded-2xl bg-dark-950/40 border border-white/10 text-white focus:ring-2 focus:ring-pink-500/60 focus:border-pink-500/60"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-sm font-extrabold text-white mb-2">Story intensity</div>
                          <div className="grid grid-cols-3 gap-3">
                            {(['low', 'medium', 'high'] as EncounterIntensity[]).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setIntensity(v)}
                                className={`px-4 py-3 rounded-2xl border text-sm font-extrabold transition-colors ${intensity === v
                                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                  }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-dark-400 mt-3">
                            Low = slow, gentle. Medium = balanced. High = more charged, still consent-forward and realistic.
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={startEncounter}
                        className="mt-8 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 text-white font-extrabold transition-all shadow-lg shadow-pink-500/20"
                      >
                        Start Encounter
                      </button>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-dark-950/10 backdrop-blur-xl p-6 sm:p-8">
                      <div className="text-sm font-extrabold text-white">Encounter rules</div>
                      <div className="text-dark-300 text-sm mt-2">
                        Encounter Mode injects the scenario into every prompt and enforces realism.
                      </div>
                      <div className="mt-5 space-y-2">
                        {selectedScenario.behavioralRules.map((r) => (
                          <div key={r} className="text-sm text-dark-200">- {r}</div>
                        ))}
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
