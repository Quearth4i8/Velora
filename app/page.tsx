'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CharacterSelection } from '@/components/CharacterSelection';
import { Navbar } from '@/components/Navbar';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />
      
      {/* Hero Section */}
      <motion.div
        className="container mx-auto px-4 py-24 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Image - Positioned Absolutely */}
        <div className="hidden lg:block absolute left-8 top-8">
          <div className="relative">
            <img 
              src="/images/left.png" 
              alt="Left decoration" 
              className="w-48 h-auto opacity-80 neon-glow"
            />
            {/* Shining dots overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 star-pulse">
                <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute top-12 left-8 star-pulse" style={{animationDelay: '0.3s'}}>
                <svg className="w-2 h-2 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute bottom-8 left-6 star-pulse" style={{animationDelay: '0.7s'}}>
                <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute bottom-4 left-12 star-pulse" style={{animationDelay: '1.1s'}}>
                <svg className="w-2 h-2 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute top-8 left-16 star-pulse" style={{animationDelay: '1.5s'}}>
                <svg className="w-1.5 h-1.5 text-pink-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Image - Positioned Absolutely */}
        <div className="hidden lg:block absolute right-8 top-12">
          <div className="relative">
            <img 
              src="/images/right.png" 
              alt="Right decoration" 
              className="w-48 h-auto opacity-80 neon-glow"
            />
            {/* Shining dots overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 right-4 star-pulse">
                <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute top-12 right-8 star-pulse" style={{animationDelay: '0.3s'}}>
                <svg className="w-2 h-2 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute bottom-8 right-6 star-pulse" style={{animationDelay: '0.7s'}}>
                <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute bottom-4 right-12 star-pulse" style={{animationDelay: '1.1s'}}>
                <svg className="w-2 h-2 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="absolute top-8 right-16 star-pulse" style={{animationDelay: '1.5s'}}>
                <svg className="w-1.5 h-1.5 text-pink-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Content - Full Width */}
        <div className="text-center max-w-4xl mx-auto mb-12 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="gradient-text title-shine">Welcome to Velora</span>
          </h1>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto mb-8">
            Create and chat to your perfect WAIFU
          </p>
        </div>
        
        {/* Search Bar - Full Width */}
        <div className="relative z-10">
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
    </div>
  );
}
