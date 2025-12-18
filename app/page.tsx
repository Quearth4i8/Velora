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
      <div className="container mx-auto px-4 pt-16 pb-12 relative">
        {/* Left Image - Positioned Absolutely */}
        <motion.div 
          className="hidden lg:block absolute left-8 top-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative">
            <img 
              src="/images/left.png" 
              alt="Left decoration" 
              className="w-56 h-auto opacity-90 neon-glow hover:scale-105 transition-transform duration-500"
            />
            {/* Shining dots overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { top: '16px', left: '16px', size: 'w-3 h-3', delay: '0s' },
                { top: '48px', left: '32px', size: 'w-2 h-2', delay: '0.3s' },
                { bottom: '32px', left: '24px', size: 'w-3 h-3', delay: '0.7s' },
                { bottom: '16px', left: '48px', size: 'w-2 h-2', delay: '1.1s' },
                { top: '32px', left: '64px', size: 'w-1.5 h-1.5', delay: '1.5s' },
              ].map((star, i) => (
                <div key={i} className="absolute star-pulse" style={{ ...star, animationDelay: star.delay }}>
                  <svg className={`${star.size} text-pink-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Right Image - Positioned Absolutely */}
        <motion.div 
          className="hidden lg:block absolute right-8 top-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative">
            <img 
              src="/images/right.png" 
              alt="Right decoration" 
              className="w-56 h-auto opacity-90 neon-glow hover:scale-105 transition-transform duration-500"
            />
            {/* Shining dots overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { top: '16px', right: '16px', size: 'w-3 h-3', delay: '0s' },
                { top: '48px', right: '32px', size: 'w-2 h-2', delay: '0.3s' },
                { bottom: '32px', right: '24px', size: 'w-3 h-3', delay: '0.7s' },
                { bottom: '16px', right: '48px', size: 'w-2 h-2', delay: '1.1s' },
                { top: '32px', right: '64px', size: 'w-1.5 h-1.5', delay: '1.5s' },
              ].map((star, i) => (
                <div key={i} className="absolute star-pulse" style={{ ...star, animationDelay: star.delay }}>
                  <svg className={`${star.size} text-pink-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Center Content */}
        <div className="text-center max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              <span className="gradient-text title-shine text-6xl md:text-8xl">Velora</span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-dark-300 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create and chat with your <span className="text-pink-400 font-semibold">perfect AI companion</span>
            <br />
            <span className="text-dark-400 text-lg">Powered by advanced AI technology</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <SearchBar 
              onSearch={(query) => {
                console.log('Searching for:', query);
              }}
            />
          </motion.div>

                  </div>
      </div>

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
