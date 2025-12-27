'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useBlurNSFW } from '@/lib/useBlurNSFW';

export default function SettingsPage() {
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-300 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-dark-300">Manage your preferences and account settings</p>
          </div>

          {/* Settings Card */}
          <div className="relative overflow-hidden bg-dark-800/50 backdrop-blur-sm border border-pink-500/10 rounded-2xl p-6 shadow-2xl shadow-pink-500/5">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-pink-500/10 via-transparent to-fuchsia-500/10" />
            <div className="relative">
              {/* NSFW Content Settings */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Content Preferences</h2>

                <div className="bg-dark-900/50 border border-dark-700/80 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-medium">Blur NSFW Content</label>
                      <p className="text-dark-400 text-sm mt-1">
                        Automatically blur images with adult content in the gallery
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={toggleBlurNSFW}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${blurNSFW ? 'bg-pink-600 shadow-lg shadow-pink-500/30' : 'bg-dark-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${blurNSFW ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-700/70 pt-6 mb-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Special Characters</h2>
                    <p className="text-dark-400 text-sm mt-1">Manage and edit your special character collection</p>
                  </div>

                  <Link
                    href="/manage-characters"
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-fuchsia-500 hover:from-pink-500 hover:to-fuchsia-400 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-pink-500/20"
                  >
                    Manage Characters
                  </Link>
                </div>

                <div className="bg-dark-900/50 border border-dark-700/80 rounded-xl p-4">
                  <p className="text-dark-400 text-sm">
                    Visit the <Link href="/manage-characters" className="text-pink-400 hover:text-pink-300">Management Page</Link> to add, edit, or delete special characters.
                  </p>
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

