'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ethnicity, CharacterStyle, HairColor } from '@/lib/types';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterCategory {
  name: string;
  key: string;
  options: FilterOption[];
}

interface CharacterTraits {
  ethnicity?: string | null;
  generation?: {
    style?: string | null;
  } | null;
  appearance?: {
    hairColor?: string | null;
  } | null;
  personality?: {
    archetype?: string | null;
  } | null;
}

interface TraitFilterProps {
  onFilterChange: (filters: CharacterTraits) => void;
}

const filterCategories: FilterCategory[] = [
  {
    name: 'Personality',
    key: 'personality.archetype',
    options: [
      { value: 'jealous-flame', label: 'Jealous Flame' },
      { value: 'cunning-innocent', label: 'Cunning Innocent' },
      { value: 'power-play', label: 'Power Play' },
      { value: 'mysterious-lover', label: 'Mysterious Lover' },
      { value: 'sweet-submissive', label: 'Sweet Submissive' },
      { value: 'custom', label: 'Custom' },
    ]
  },
  {
    name: 'Hair Color',
    key: 'appearance.hairColor',
    options: [
      { value: '#000000', label: 'Black', color: '#000000' },
      { value: '#8B4513', label: 'Brown', color: '#8B4513' },
      { value: '#FFD700', label: 'Blonde', color: '#FFD700' },
      { value: '#DC143C', label: 'Red', color: '#DC143C' },
      { value: '#800080', label: 'Purple', color: '#800080' },
      { value: '#FF69B4', label: 'Pink', color: '#FF69B4' },
      { value: '#0000FF', label: 'Blue', color: '#0000FF' },
      { value: '#008000', label: 'Green', color: '#008000' },
    ]
  }
];

export function TraitFilter({ onFilterChange }: TraitFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterClick = (categoryKey: string, value: string) => {
    const newFilters = { ...selectedFilters };
    
    if (newFilters[categoryKey] === value) {
      delete newFilters[categoryKey];
    } else {
      newFilters[categoryKey] = value;
    }
    
    setSelectedFilters(newFilters);
    
    const filters: CharacterTraits = {};
    
    Object.entries(newFilters).forEach(([key, val]) => {
      if (key === 'appearance.hairColor') {
        filters.appearance = { hairColor: val as HairColor };
      } else if (key === 'personality.archetype') {
        filters.personality = { archetype: val };
      }
    });
    
    onFilterChange(filters);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  const getFilterLabel = (categoryKey: string, value: string) => {
    const category = filterCategories.find(c => c.key === categoryKey);
    const option = category?.options.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className="mb-6">
      <div className="bg-dark-800/30 backdrop-blur-sm border border-dark-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-white font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded-full border border-pink-500/30">
                {Object.keys(selectedFilters).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="text-xs text-pink-400 hover:text-pink-300 transition-colors px-2 py-1 hover:bg-pink-500/10 rounded"
              >
                Clear
              </button>
            )}
            <motion.svg
              className="w-5 h-5 text-dark-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-dark-700/50 pt-4">
                <div className="space-y-3">
                {filterCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">{category.name}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {category.options.map((option) => {
                        const isSelected = selectedFilters[category.key] === option.value;
                        
                        return (
                          <motion.button
                            key={option.value}
                            onClick={() => handleFilterClick(category.key, option.value)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                              ${isSelected 
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                                : 'bg-dark-800/50 text-dark-300 border border-dark-600/50 hover:border-pink-500/50 hover:bg-dark-700/50'
                              }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {option.color && (
                              <span 
                                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-white/20"
                                style={{ backgroundColor: option.color }}
                              />
                            )}
                            {option.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasActiveFilters && !isExpanded && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-md border border-pink-500/30 flex items-center gap-1"
              >
                {getFilterLabel(key, value)}
                <button
                  onClick={() => handleFilterClick(key, value)}
                  className="hover:text-pink-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
