'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const randomNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake'];

export function Navbar() {
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Set a random name on component mount
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
    setUserName(randomName);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileDropdown && !target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-sm border-b border-dark-800"
    >
      <div className="max-w-7xl mx-auto px-0 sm:px-1 lg:px-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/images/velora.png" 
                alt="Velora Logo" 
                className="w-12 h-12 rounded-lg transform translate-y-1"
              />
              <span className="text-xl font-bold text-pink-400">Velora</span>
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <div className="flex-1 hidden md:flex items-center justify-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/') ? 'text-pink-400' : 'text-dark-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/create" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/create') ? 'text-pink-400' : 'text-dark-300 hover:text-white'
              }`}
            >
              Create
            </Link>
            <Link 
              href="/gallery" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/gallery') ? 'text-pink-400' : 'text-dark-300 hover:text-white'
              }`}
            >
              Gallery
            </Link>
            <Link 
              href="/community" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/community') ? 'text-pink-400' : 'text-dark-300 hover:text-white'
              }`}
            >
              Community
            </Link>
          </div>

          {/* Profile Button */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 text-dark-300 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-dark-800"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="hidden sm:block font-medium">{userName}</span>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-50">
                <Link
                  href="/settings"
                  className="flex items-center space-x-2 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors duration-200"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    // TODO: Implement logout functionality
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
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
    </nav>
  );
};
