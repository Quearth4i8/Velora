'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function SettingsPage() {
  const [blurNSFW, setBlurNSFW] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedBlurNSFW = localStorage.getItem('blurNSFW');
    if (savedBlurNSFW !== null) {
      setBlurNSFW(JSON.parse(savedBlurNSFW));
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('blurNSFW', JSON.stringify(blurNSFW));
  }, [blurNSFW]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />
      
      <motion.div
        className="container mx-auto px-4 py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200 mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-dark-400">Manage your preferences and account settings</p>
          </div>

          {/* Settings Card */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-2xl p-6">
            {/* NSFW Content Settings */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Content Preferences</h2>
              
              <div className="bg-dark-900/50 border border-dark-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Blur NSFW Content</label>
                    <p className="text-dark-400 text-sm mt-1">
                      Automatically blur images with adult content in the gallery
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setBlurNSFW(!blurNSFW)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      blurNSFW ? 'bg-pink-600' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        blurNSFW ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Settings (Placeholder) */}
            <div className="border-t border-dark-700 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="text-dark-400">
                  <p>More settings coming soon...</p>
                  <p className="text-sm mt-2">• Profile customization</p>
                  <p className="text-sm">• Privacy controls</p>
                  <p className="text-sm">• Notification preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Status */}
          <motion.div
            className="mt-6 text-center text-pink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Settings are saved automatically
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
