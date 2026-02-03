'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { ETHNICITY_TO_RACE_MAP } from '@/config/ethnicity-prompts';
import type { CharacterDraft } from '@/lib/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  characters?: CharacterDraft[];
  onSelectResult?: (character: CharacterDraft) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  characters = [],
  onSelectResult,
  placeholder = "Search characters by name, race, or ethnicity...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const uniq = new Map<string, CharacterDraft>();
    for (const c of characters) {
      if (!c?.id) continue;

      const name = (c.name || '').toLowerCase();
      const ethnicity = (c.identity?.ethnicity || '').toString().toLowerCase();
      const race = c.identity?.ethnicity ? (ETHNICITY_TO_RACE_MAP as any)[c.identity.ethnicity] : '';
      const raceLower = (race || '').toLowerCase();

      const haystack = `${name} ${ethnicity} ${raceLower}`;
      if (haystack.includes(normalizedQuery)) {
        uniq.set(c.id, c);
      }
    }

    return Array.from(uniq.values()).slice(0, 8);
  }, [characters, normalizedQuery]);

  useEffect(() => {
    if (!normalizedQuery) {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  }, [normalizedQuery, results.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    if (results.length > 0 && activeIndex >= 0 && activeIndex < results.length) {
      onSelectResult?.(results[activeIndex]);
      setIsOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery); // Real-time search
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const getRaceLabel = (c: CharacterDraft) => {
    if (!c.identity?.ethnicity) return 'Unknown';
    return (ETHNICITY_TO_RACE_MAP as any)[c.identity.ethnicity] || 'Unknown';
  };

  const getEthnicityLabel = (c: CharacterDraft) => {
    if (!c.identity?.ethnicity) return 'Unknown';
    return String(c.identity.ethnicity)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const selectResult = (c: CharacterDraft) => {
    onSelectResult?.(c);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectResult(results[activeIndex]);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <motion.div
      className={`max-w-2xl mx-auto relative z-[100] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative" ref={containerRef}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-5 h-5 text-dark-400 group-focus-within:text-pink-400 transition-colors" strokeWidth={2.25} />
            </div>
          
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-12 pr-12 py-4 bg-dark-900/40 text-white rounded-2xl border border-white/10 
                       focus:border-pink-500/50 focus:outline-none focus:ring-4 focus:ring-pink-500/10
                       placeholder-dark-400 backdrop-blur-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
            />
          
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.25} />
              </button>
            )}
          </div>

          {isOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 mt-3 z-[200]">
              <div className="rounded-2xl border border-white/10 bg-dark-950/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  {results.map((c, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectResult(c)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isActive ? 'bg-pink-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{c.name || 'Character'}</div>
                            <div className="text-xs text-dark-300 mt-0.5 truncate">
                              <span className="text-pink-300/90">{getRaceLabel(c)}</span>
                              <span className="mx-2 text-dark-500">•</span>
                              <span className="text-white/70">{getEthnicityLabel(c)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.generation?.style && (
                              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-white/5 text-white/70 border border-white/10">
                                {String(c.generation.style).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};
