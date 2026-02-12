'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { LogOut, User as UserIcon, Settings, UserCircle } from 'lucide-react';
import { supabase, profileService } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { wallet } from '@/lib/wallet';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setPointsBalance(wallet.getLocalBalance());
        return;
      }
      try {
        const data = await profileService.getProfile(user.id);
        setProfile(data);
        const pointsFromProfile = typeof data?.points_balance === 'number' ? Math.max(0, Math.floor(data.points_balance)) : null;
        if (pointsFromProfile !== null) {
          wallet.setLocalBalance(pointsFromProfile);
          setPointsBalance(pointsFromProfile);
        } else {
          setPointsBalance(await wallet.getBalance());
        }
      } catch (err) {
        console.error('Error fetching navbar profile:', err);
        setPointsBalance(await wallet.getBalance());
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
    { href: '/encounters', label: 'Encounters' },
    { href: '/mini-games', label: 'Mini Games' },
    { href: '/tentacles', label: 'Tentacles' },
  ];

  const mainNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/create', label: 'Create' },
    { href: '/gallery', label: 'Gallery' },
  ];

  const extraNavLinks = [
    { href: '/encounters', label: 'Encounters' },
    { href: '/mini-games', label: 'Mini Games' },
    { href: '/tentacles', label: 'Tentacles' },
  ];

  const isExtraActive = extraNavLinks.some((l) => isActive(l.href));

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-800 will-change-transform transform-gpu">
      <div className="mx-auto px-10 sm:px-16 lg:px-20 will-change-auto">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
          <div className="flex items-center justify-self-start">
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

          <div className="hidden md:flex items-center justify-center justify-self-center space-x-1">
            {mainNavLinks.map((link) => (
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

            <div className="relative group">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center gap-2 ${isExtraActive
                  ? 'text-pink-400 bg-pink-400/10'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`}
                aria-haspopup="true"
              >
                <span>Extra</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute left-0 mt-2 w-48 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 origin-top-left">
                <div className="p-1.5">
                  {extraNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center px-3 py-2.5 rounded-xl transition-colors duration-150 ${isActive(link.href)
                        ? 'text-pink-400 bg-pink-400/10'
                        : 'text-dark-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-self-end space-x-4">
            {user ? (
              <div className="relative flex items-center gap-3" ref={profileRef}>
                <div className="hidden sm:flex items-center text-[11px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70">
                  <span className="font-semibold text-white/60">Points</span>
                  <span className="ml-2 font-extrabold text-white">{pointsBalance}</span>
                </div>
                <div className="relative">
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
                    <span className="hidden sm:block font-medium text-sm max-w-[160px] truncate">
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
                        <p className="text-xs text-white/70 mt-1">
                          Points: <span className="font-extrabold text-white">{pointsBalance}</span>
                        </p>
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
                        <Link
                          href="/buy-points"
                          className="flex items-center justify-between px-3 py-2.5 text-dark-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors duration-150"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <span className="text-sm">Buy Points</span>
                          <span className="text-xs font-extrabold text-white/70">{pointsBalance}</span>
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
