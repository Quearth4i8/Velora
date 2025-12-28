'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { characterAPI } from '@/lib/api';
import { CharacterDraft } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MyCharactersPage() {
    const [characters, setCharacters] = useState<CharacterDraft[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCharacters = async () => {
            try {
                const result = await characterAPI.getCharacters();
                if (result.success && result.data) {
                    // Sort by createdAt descending (assuming ID or date helps, or data comes sorted)
                    // Since createdAt might be a string or Date object depending on deserialization, 
                    // we'll try to sort safely. Api.ts deserializes dates.
                    const sorted = [...result.data].sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                    });
                    setCharacters(sorted);
                }
            } catch (error) {
                console.error('Failed to load characters', error);
            } finally {
                setLoading(false);
            }
        };
        loadCharacters();
    }, []);

    const latestCharacters = characters.slice(0, 3);
    const allCharacters = characters;

    const CharacterCard = ({ character, featured = false }: { character: CharacterDraft; featured?: boolean }) => {
        const imageUrl = character.generation?.generatedImage;

        return (
            <Link href={`/chat/${character.id}`}>
                <motion.div
                    className={`group relative bg-dark-800/40 border border-dark-700/50 hover:border-pink-500/30 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 flex ${featured ? 'flex-col items-center text-center gap-4' : 'flex-row items-center gap-4'}`}
                >
                    {/* Circular Image Icon */}
                    <div className={`relative overflow-hidden rounded-full border-2 border-dark-600 group-hover:border-pink-500/50 transition-colors shrink-0 ${featured ? 'w-24 h-24' : 'w-16 h-16'}`}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={character.name || 'Character'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                                <span className="text-xl font-bold text-dark-400 capitalize">
                                    {character.name?.charAt(0) || '?'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={`${featured ? 'w-full' : 'min-w-0 flex-1'}`}>
                        <h3 className={`font-bold text-white group-hover:text-pink-400 transition-colors truncate ${featured ? 'text-lg' : 'text-base'}`}>
                            {character.name || 'Unnamed'}
                        </h3>
                        <p className="text-dark-400 text-sm truncate mt-1">
                            {character.personality?.archetype || 'Custom Character'}
                        </p>
                        {featured && (
                            <div className="mt-3 flex justify-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-dark-900 text-dark-300 border border-dark-700">
                                    {character.identity?.age || '20s'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-dark-900 text-dark-300 border border-dark-700 capitalize">
                                    {character.identity?.ethnicity?.replace('_', ' ') || 'Human'}
                                </span>
                            </div>
                        )}
                    </div>

                    {!featured && (
                        <div className="text-dark-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    )}
                </motion.div>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
            <Navbar />

            <motion.div
                className="container mx-auto px-4 py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-300 via-pink-400 to-pink-500 bg-clip-text text-transparent">
                            My Characters
                        </h1>
                        <p className="text-dark-300 mt-2">Resume your chats and manage your creations</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size={48} />
                        </div>
                    ) : characters.length === 0 ? (
                        <div className="bg-dark-900/50 border border-dark-800 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No characters found</h3>
                            <p className="text-dark-400 mb-6 max-w-md mx-auto">
                                You haven't created any characters yet. Start by creating your first AI companion!
                            </p>
                            <Link
                                href="/create"
                                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-pink-500/20"
                            >
                                Create Character
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Latest 3 Section */}
                            <div className="mb-10">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                    Latest Creations
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {latestCharacters.map((char) => (
                                        <CharacterCard key={char.id} character={char} featured={true} />
                                    ))}
                                </div>
                            </div>

                            {/* All Characters Section */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                    All Characters
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {allCharacters.map((char) => (
                                        <CharacterCard key={char.id} character={char} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
