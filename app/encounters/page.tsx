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

        <div className="container mx-auto px-4 pt-10 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Encounters
                  </h1>
                  <p className="text-dark-300 mt-2 max-w-3xl">
                    Scenario-based, immersive story mode. Choose a curated scene, pick a character, then chat with stricter realism and slower pacing.
                  </p>
                </div>

                <button
                  className="shrink-0 px-4 py-2 rounded-xl border border-dark-700 bg-dark-900/30 text-dark-200 hover:bg-dark-800/60 transition-colors"
                  onClick={() => router.push('/encounters/history')}
                >
                  History
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
              <button
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${step === 'scenario'
                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                  : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                  }`}
                onClick={() => {
                  setStep('scenario');
                  setSelectedScenario(null);
                  setSelectedCharacter(null);
                }}
              >
                1. Scenario
              </button>
              <button
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${step === 'character'
                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                  : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                  }`}
                onClick={() => {
                  if (!selectedScenario) return;
                  setStep('character');
                }}
                disabled={!selectedScenario}
              >
                2. Character
              </button>
              <button
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${step === 'options'
                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                  : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                  }`}
                onClick={() => {
                  if (!selectedScenario || !selectedCharacter) return;
                  setStep('options');
                }}
                disabled={!selectedScenario || !selectedCharacter}
              >
                3. Options
              </button>
            </div>

            {step === 'scenario' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ENCOUNTER_SCENARIOS.map((scenario) => {
                  const selected = selectedScenario?.id === scenario.id;
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
                      className={`text-left p-6 rounded-2xl border transition-all duration-200 ${selected
                        ? 'border-pink-500/70 bg-pink-500/10 ring-2 ring-pink-500/15'
                        : 'border-dark-700/60 bg-dark-900/30 hover:border-pink-500/35 hover:bg-dark-900/45'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{scenario.title}</h3>
                          <p className="text-dark-300 mt-1">{scenario.shortDescription}</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-dark-800/60 border border-dark-700 text-dark-200">
                          {scenario.id}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-dark-400">Narrative intent</div>
                        <div className="text-sm text-dark-200 mt-1">{scenario.narrativeIntent}</div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-dark-400">AI rules</div>
                        <div className="mt-2 space-y-1">
                          {scenario.behavioralRules.slice(0, 3).map((r) => (
                            <div key={r} className="text-sm text-dark-200">- {r}</div>
                          ))}
                          {scenario.behavioralRules.length > 3 && (
                            <div className="text-xs text-dark-500">+ {scenario.behavioralRules.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 'character' && selectedScenario && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs text-dark-500">Selected scenario</div>
                    <div className="text-lg font-bold text-white">{selectedScenario.title}</div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl border border-dark-700 bg-dark-900/30 text-dark-200 hover:bg-dark-800/60 transition-colors"
                    onClick={() => setStep('scenario')}
                  >
                    Change
                  </button>
                </div>

                {isLoadingCharacters ? (
                  <div className="py-16 text-center text-dark-400">Loading characters...</div>
                ) : characters.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-dark-300">No characters found.</div>
                    <div className="text-dark-500 text-sm mt-2">Create a character first, then come back to start an Encounter.</div>
                    <button
                      className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold"
                      onClick={() => router.push('/create')}
                    >
                      Create Character
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {characters.map((c) => {
                      const selected = selectedCharacter?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCharacter(c);
                            setStep('options');
                          }}
                          className={`text-left rounded-2xl overflow-hidden border transition-all duration-200 ${selected
                            ? 'border-pink-500/70 bg-pink-500/10 ring-2 ring-pink-500/15'
                            : 'border-dark-700/60 bg-dark-900/30 hover:border-pink-500/35 hover:bg-dark-900/45'
                            }`}
                        >
                          <div className="relative aspect-[3/4] bg-gradient-to-br from-dark-800 to-dark-950">
                            {c.generation?.generatedImage ? (
                              <img
                                src={c.generation.generatedImage}
                                alt={c.name || 'Character'}
                                className="w-full h-full object-cover opacity-90"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-dark-500">
                                No image
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="text-white font-bold text-lg">
                                {c.name || 'Unnamed'}
                              </div>
                              <div className="text-xs text-pink-300 capitalize">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-dark-900/30 border border-dark-700/60 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-dark-500">Scenario</div>
                        <div className="text-xl font-bold text-white">{selectedScenario.title}</div>
                        <div className="text-dark-300 mt-1">{selectedScenario.shortDescription}</div>
                      </div>
                      <button
                        className="px-4 py-2 rounded-xl border border-dark-700 bg-dark-900/30 text-dark-200 hover:bg-dark-800/60 transition-colors"
                        onClick={() => setStep('scenario')}
                      >
                        Change
                      </button>
                    </div>

                    <div className="mt-6">
                      <div className="text-xs text-dark-500">Character</div>
                      <div className="text-lg font-bold text-white">{selectedCharacter.name || 'Unnamed'}</div>
                      <button
                        className="mt-2 px-4 py-2 rounded-xl border border-dark-700 bg-dark-900/30 text-dark-200 hover:bg-dark-800/60 transition-colors"
                        onClick={() => setStep('character')}
                      >
                        Change character
                      </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Mood (optional)</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {suggestedMoods.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMood(m)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${mood === m
                                ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
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
                          className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-dark-700 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Location (optional)</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {suggestedLocations.map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setLocation(l)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${location === l
                                ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
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
                          className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-dark-700 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-sm font-semibold text-white mb-2">Story intensity</div>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as EncounterIntensity[]).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setIntensity(v)}
                              className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-bold transition-colors ${intensity === v
                                ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                                : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                                }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-dark-500 mt-2">
                          Low = slow, gentle. Medium = balanced. High = more charged, still consent-forward and realistic.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={startEncounter}
                      className="mt-8 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-extrabold transition-all shadow-lg shadow-pink-500/20"
                    >
                      Start Encounter
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-dark-900/30 border border-dark-700/60 rounded-2xl p-6">
                    <div className="text-sm font-semibold text-white">Encounter rules</div>
                    <div className="text-dark-300 text-sm mt-2">
                      Encounter Mode injects the scenario into every prompt and enforces realism.
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedScenario.behavioralRules.map((r) => (
                        <div key={r} className="text-sm text-dark-200">- {r}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
