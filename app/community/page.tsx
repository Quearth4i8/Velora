'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />

        <motion.div
          className="w-full px-4 sm:px-8 lg:px-12 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Community
              </h1>
              <p className="text-dark-400 text-lg">
                Connect with other creators and share your experiences
              </p>
            </div>

            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-600/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4 border border-pink-500/30">
                <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark-200 mb-2">Coming Soon</h3>
              <p className="text-dark-400 mb-6 max-w-md mx-auto">
                Join our community forums, share tips, and collaborate with other character creators!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
