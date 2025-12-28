'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/lib/supabase';
import { User, Shield, Check, Loader2, AlertCircle, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const profile = await profileService.getProfile(user.id);
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            username: profile.username || '',
            avatar_url: profile.avatar_url || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Basic validation
      if (formData.username && formData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Check username availability if it changed
      if (formData.username) {
        const isAvailable = await profileService.checkUsernameAvailability(formData.username, user.id);
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }

      await profileService.updateProfile(user.id, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-4 tracking-tight">
              Account Settings
            </h1>
            <p className="text-dark-400 text-lg">Personalize your experience and manage your profile</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Profile Section */}
            <div className="relative overflow-hidden bg-dark-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col h-full">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <User size={120} />
              </div>

              <div className="relative flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500">
                    <User size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Profile Identity</h2>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark-300 ml-1">Display Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full bg-white/5 border border-white/5 focus:border-pink-500/50 rounded-2xl py-3.5 px-5 text-white placeholder:text-dark-600 outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark-300 ml-1">Username</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-500">@</span>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="unique_username"
                          className="w-full bg-white/5 border border-white/5 focus:border-pink-500/50 rounded-2xl py-3.5 pl-10 pr-5 text-white placeholder:text-dark-600 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark-300 ml-1">Avatar URL</label>
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={formData.avatar_url}
                            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full bg-white/5 border border-white/5 focus:border-pink-500/50 rounded-2xl py-3.5 px-5 text-white placeholder:text-dark-600 outline-none transition-all shadow-inner"
                          />
                        </div>
                        {formData.avatar_url && (
                          <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden bg-dark-800 flex-shrink-0">
                            <img src={formData.avatar_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4">
                      {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-left-2 transition-all">
                          <AlertCircle size={16} />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex-1" />

                      <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : saveSuccess ? (
                          <>
                            <Check className="w-5 h-5 text-white" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              {/* Content Preferences Section */}
              <div className="bg-dark-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500">
                    <Shield size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Safety & Privacy</h2>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Blur NSFW Content</h3>
                      <p className="text-dark-400 text-sm">
                        Automatically blur images with adult content across the platform.
                      </p>
                    </div>

                    <button
                      onClick={toggleBlurNSFW}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${blurNSFW ? 'bg-pink-600 shadow-lg shadow-pink-500/40' : 'bg-dark-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ${blurNSFW ? 'translate-x-8' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-dark-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Manage Characters</h2>
                  <p className="text-dark-400 text-sm">View and organize your created characters</p>
                </div>
                <Link
                  href="/manage-characters"
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all active:scale-[0.95] border border-white/5"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>

          <motion.div
            className="mt-12 text-center text-dark-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Velora Account Management • &copy; 2025
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

