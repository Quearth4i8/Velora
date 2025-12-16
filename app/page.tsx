'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CharacterSelection } from '@/components/CharacterSelection';
import { Navbar } from '@/components/Navbar';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

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
        
        {/* Quick Actions */}
        <div className="flex justify-center space-x-4 mb-12">
          <Link href="/create">
            <PrimaryCTAButton 
              label="Create Character"
              onClick={() => {}}
              className="px-8 py-3"
            />
          </Link>
          <Link href="/gallery">
            <PrimaryCTAButton 
              label="Browse Gallery"
              onClick={() => {}}
              className="px-8 py-3 bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-600/50"
            />
          </Link>
        </div>
      </motion.div>

      {/* Character Gallery Section */}
      <div className="container mx-auto px-4 pb-16">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            <span className="gradient-text">Your Characters</span>
          </h2>
          <p className="text-center text-dark-400 text-base max-w-2xl mx-auto">
            Manage and interact with your created characters
          </p>
        </motion.div>

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
