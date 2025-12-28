'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { LogOut, User as UserIcon, Settings, UserCircle } from 'lucide-react';
import { supabase, profileService } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        const data = await profileService.getProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching navbar profile:', err);
      }
    }
    fetchProfile();
  }, [user]);

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
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-dark-300 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 relative rounded-lg overflow-hidden flex items-center justify-center shadow-lg shadow-pink-500/20">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block font-medium text-sm max-w-[120px] truncate">
                    {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                  </span>
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
                  <div className="absolute right-0 mt-2 w-56 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-dark-500 mb-0.5">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{profile?.full_name || user.email?.split('@')[0]}</p>
                      <p className="text-[10px] text-dark-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/manage-characters"
                        className="flex items-center space-x-3 px-3 py-2.5 text-dark-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors duration-150"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        <span className="text-sm">Manage Characters</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-3 py-2.5 text-dark-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors duration-150"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <div className="h-px bg-white/5 my-1.5 mx-1.5" />
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          signOut();
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-150"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98]"
              >
                Sign In
              </button>
            )}

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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
