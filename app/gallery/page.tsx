'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
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
              Shared Gallery
            </h1>
            <p className="text-dark-400 text-lg">
              Discover amazing characters created by our community
            </p>
          </div>
          
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-dark-200 mb-2">Coming Soon</h3>
            <p className="text-dark-400 mb-6 max-w-md mx-auto">
              The shared gallery is under construction. Check back soon to see characters shared by the community!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
