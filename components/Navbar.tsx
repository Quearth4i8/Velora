'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <motion.nav
      className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-sm border-b border-dark-800"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-0 sm:px-1 lg:px-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Velora</span>
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <div className="flex-1 hidden md:flex items-center justify-center space-x-8">
            <Link href="/create" className="text-dark-300 hover:text-white transition-colors duration-200 font-medium">
              Create
            </Link>
            <Link href="/gallery" className="text-dark-300 hover:text-white transition-colors duration-200 font-medium">
              Gallery
            </Link>
            <Link href="/community" className="text-dark-300 hover:text-white transition-colors duration-200 font-medium">
              Community
            </Link>
          </div>

          {/* Profile Button */}
          <div className="flex items-center">
            <button className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-dark-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:block font-medium">Profile</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="text-dark-300 hover:text-white p-2"
              onClick={() => {
                // TODO: Implement mobile menu
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
