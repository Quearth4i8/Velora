'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CharacterSelection } from '@/components/CharacterSelection';
import { Navbar } from '@/components/Navbar';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { SearchBar } from '@/components/ui/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />
      
      {/* Hero Section */}
      <motion.div
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="gradient-text">Welcome to Velora</span>
          </h1>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            Create stunning AI characters with unique personalities, appearances, and styles. 
            Bring your imagination to life with advanced AI technology.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar 
            onSearch={(query) => {
              // TODO: Implement search functionality
              console.log('Searching for:', query);
            }}
          />
        </div>
      </motion.div>

      {/* Character Gallery Section */}
      <div className="container mx-auto px-4 pb-16">
        <CharacterSelection 
          onSelectCharacter={(character) => {
            if (character.id) {
              window.location.href = `/${character.id}`;
            }
          }}
          onCreateNew={() => {
            window.location.href = '/create';
          }}
        />
      </div>
    </div>
  );
}
