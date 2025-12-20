'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CharacterBuilder } from '@/components/CharacterBuilder';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function CreateCharacterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />
      
      <motion.div
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Create Your Character
            </h1>
            <p className="text-dark-400 text-lg">
              Design your perfect AI companion with custom appearance, personality, and style
            </p>
          </div>
          
          <CharacterBuilder />
        </div>
      </motion.div>
      </div>
    </div>
  );
}
