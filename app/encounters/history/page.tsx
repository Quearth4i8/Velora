'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import type { CharacterDraft } from '@/lib/types';
import { ENCOUNTER_SCENARIOS, getEncounterScenarioById } from '@/data/encounters';
import { useDialog } from '@/components/ui/DialogProvider';

type DbConversation = {
  id: string;
  character_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ParsedEncounterTitle = {
  scenarioId: string;
  mood?: string;
  location?: string;
  intensity?: string;
};

const parseEncounterTitle = (title: string | null): ParsedEncounterTitle | null => {
  const raw = String(title || '').trim();
  if (!raw.toLowerCase().startsWith('encounter:')) return null;

  const [first, ...rest] = raw.split('|').map((s) => s.trim()).filter(Boolean);
  const scenarioId = first.slice('encounter:'.length).trim();
  if (!scenarioId) return null;

  const out: ParsedEncounterTitle = { scenarioId };
  for (const part of rest) {
    const [k, vRaw] = part.split('=');
    const key = String(k || '').trim();
    const v = String(vRaw || '').trim();
    if (!key) continue;
    const decoded = (() => {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    })();

    if (key === 'mood') out.mood = decoded;
    if (key === 'location') out.location = decoded;
    if (key === 'intensity') out.intensity = decoded;
  }

  return out;
};

export default function EncounterHistoryPage() {
  const router = useRouter();
  const dialog = useDialog();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [charactersById, setCharactersById] = useState<Record<string, CharacterDraft>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [convs, custom, special] = await Promise.all([
          characterAPI.listEncounterConversations(),
          characterAPI.getCharacters(),
          characterAPI.getSpecialCharacters(),
        ]);

        if (!convs.success || !Array.isArray(convs.data)) {
          throw convs.error instanceof Error ? convs.error : new Error('Failed to load encounter history');
        }

        const list = convs.data as any[];
        setConversations(
          list
            .filter((c) => c && typeof c.id === 'string')
            .map((c) => ({
              id: String(c.id),
              character_id: String(c.character_id || ''),
              title: c.title ?? null,
              created_at: String(c.created_at || ''),
              updated_at: String(c.updated_at || c.created_at || ''),
            }))
        );

        const next: Record<string, CharacterDraft> = {};
        const allChars: CharacterDraft[] = [];
        if (custom.success && Array.isArray(custom.data)) allChars.push(...custom.data);
        if (special.success && Array.isArray(special.data)) allChars.push(...special.data);
        for (const ch of allChars) {
          if (!ch?.id) continue;
          next[String(ch.id)] = ch;
        }
        setCharactersById(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load encounter history');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const rows = useMemo(() => {
    return conversations
      .map((c) => {
        const parsed = parseEncounterTitle(c.title);
        if (!parsed) return null;
        const scenario = getEncounterScenarioById(parsed.scenarioId);
        return {
          conversationId: c.id,
          characterId: c.character_id,
          character: charactersById[c.character_id],
          scenario,
          parsed,
          updatedAt: c.updated_at || c.created_at,
        };
      })
      .filter(Boolean) as Array<{
        conversationId: string;
        characterId: string;
        character?: CharacterDraft;
        scenario?: (typeof ENCOUNTER_SCENARIOS)[number];
        parsed: ParsedEncounterTitle;
        updatedAt: string;
      }>;
  }, [conversations, charactersById]);

  const handleContinue = (row: (typeof rows)[number]) => {
    const scenarioId = row.parsed.scenarioId;
    const characterId = row.characterId;

    const params = new URLSearchParams();
    params.set('scenario', scenarioId);
    params.set('character', characterId);
    params.set('conversation', row.conversationId);

    if (row.parsed.mood) params.set('mood', row.parsed.mood);
    if (row.parsed.location) params.set('location', row.parsed.location);
    if (row.parsed.intensity) params.set('intensity', row.parsed.intensity);

    router.push(`/encounters/chat?${params.toString()}`);
  };

  const handleDelete = async (row: (typeof rows)[number]) => {
    const ok = await dialog.confirm({
      title: 'Delete encounter?',
      message: 'This will permanently delete this encounter session and its messages. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    const res = await characterAPI.deleteConversation(row.conversationId);
    if (!res.success) {
      await dialog.alert({ title: 'Error', message: 'Failed to delete encounter. Please try again.' });
      return;
    }

    try {
      const storageKey = `encounter_conversation_${row.characterId}_${row.parsed.scenarioId}`;
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }

    setConversations((prev) => prev.filter((c) => c.id !== row.conversationId));
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
                    Encounter History
                  </h1>
                  <p className="text-dark-300 mt-2 max-w-3xl">
                    Resume a previous scene or delete it.
                  </p>
                </div>

                <button
                  className="shrink-0 px-4 py-2 rounded-xl border border-dark-700 bg-dark-900/30 text-dark-200 hover:bg-dark-800/60 transition-colors"
                  onClick={() => router.push('/encounters')}
                >
                  Back
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-dark-400">Loading history...</div>
            ) : error ? (
              <div className="py-16 text-center">
                <div className="text-dark-200 font-semibold">Could not load encounter history</div>
                <div className="text-dark-400 mt-2">{error}</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-dark-200 font-semibold">No encounter sessions yet</div>
                <div className="text-dark-400 mt-2">Start a scene from Encounters and it will show up here.</div>
                <button
                  className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold"
                  onClick={() => router.push('/encounters')}
                >
                  Start an Encounter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rows.map((row) => {
                  const character = row.character;
                  const scenario = row.scenario;
                  const updated = row.updatedAt ? new Date(row.updatedAt) : null;

                  return (
                    <div
                      key={row.conversationId}
                      className="rounded-2xl border border-dark-700/60 bg-dark-900/30 overflow-hidden"
                    >
                      <div className="flex gap-4 p-5">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-dark-800 to-dark-950 border border-dark-700/60 shrink-0">
                          {character?.generation?.generatedImage ? (
                            <img
                              src={character.generation.generatedImage}
                              alt={character.name || 'Character'}
                              className="w-full h-full object-cover opacity-90"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-500 text-xs">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-dark-400">{character?.name || 'Unknown character'}</div>
                          <div className="text-xl font-bold text-white mt-1 truncate">
                            {scenario?.title || row.parsed.scenarioId}
                          </div>
                          <div className="text-dark-300 mt-2 text-sm line-clamp-2">
                            {scenario?.shortDescription || 'Encounter scene'}
                          </div>
                          <div className="text-[12px] text-dark-400 mt-3">
                            {[
                              row.parsed.mood ? `Mood: ${row.parsed.mood}` : null,
                              row.parsed.location ? `Location: ${row.parsed.location}` : null,
                              row.parsed.intensity ? `Intensity: ${row.parsed.intensity}` : null,
                            ]
                              .filter(Boolean)
                              .join('  •  ')}
                          </div>
                          <div className="text-[12px] text-dark-500 mt-2">
                            {updated ? `Updated: ${updated.toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 flex items-center justify-end gap-2">
                        <button
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/15 transition-all duration-200"
                          onClick={() => handleDelete(row)}
                        >
                          Delete
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-semibold border border-dark-700/60 bg-dark-900/30 text-dark-200 hover:bg-dark-900/40 hover:border-pink-500/20 transition-all duration-200"
                          onClick={() => handleContinue(row)}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
