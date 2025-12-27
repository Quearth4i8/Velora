'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showProfileDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown, showMobileMenu]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/create', label: 'Create' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/my-characters', label: 'My Characters' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-800 will-change-transform transform-gpu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 will-change-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <img
                src="/images/velora.png"
                alt="Velora Logo"
                className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">
                Velora
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive(link.href)
                  ? 'text-pink-400 bg-pink-400/10'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-all duration-200"
                aria-expanded={showProfileDropdown}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="hidden sm:block font-medium text-sm">username</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl overflow-hidden">
                  <Link
                    href="/manage-characters"
                    className="flex items-center space-x-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors duration-150"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm">Manage Characters</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors duration-150"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Settings</span>
                  </Link>
                  <div className="border-t border-dark-700" />
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      console.log('Logout clicked');
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors duration-150"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>

            <div className="md:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
                aria-expanded={showMobileMenu}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-dark-800 py-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive(link.href)
                    ? 'text-pink-400 bg-pink-400/10'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
