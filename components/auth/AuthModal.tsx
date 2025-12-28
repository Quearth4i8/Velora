'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Github, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    isFullPage?: boolean;
}

export function AuthModal({ isOpen, onClose, isFullPage = false }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={isFullPage ? "w-full" : "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"}>
                {/* Backdrop */}
                {!isFullPage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
                    />
                )}

                {/* Modal Container */}
                <motion.div
                    initial={isFullPage ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={isFullPage ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-md overflow-hidden bg-dark-900 border border-white/10 rounded-[2.5rem] shadow-2xl ${isFullPage ? 'mx-auto' : ''}`}
                >
                    {/* Top Decorative Gradient */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600" />

                    {!isFullPage && (
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-dark-400 hover:text-white transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    <div className="p-5 sm:p-6 pt-8">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                {mode === 'login' ? 'Welcome Back' : 'Join Velora'}
                            </h2>
                            <p className="text-dark-400 text-sm">
                                {mode === 'login'
                                    ? 'Sign in to continue your creative journey'
                                    : 'Start creating your perfect AI companions'}
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 group-focus-within:text-pink-500 transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/5 focus:border-pink-500/50 rounded-2xl py-2.5 pl-11 pr-4 text-white placeholder:text-dark-500 outline-none transition-all shadow-inner text-sm"
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 group-focus-within:text-pink-500 transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/5 focus:border-pink-500/50 rounded-2xl py-2.5 pl-11 pr-4 text-white placeholder:text-dark-500 outline-none transition-all shadow-inner text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="my-4 flex items-center gap-3 text-dark-500 text-xs">
                            <div className="h-px flex-1 bg-white/5" />
                            <span>or continue with</span>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleOAuth('google')}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white transition-all active:scale-[0.98] text-sm"
                            >
                                <Chrome className="w-4 h-4" />
                                <span>Google</span>
                            </button>
                            <button
                                onClick={() => handleOAuth('github')}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white transition-all active:scale-[0.98] text-sm"
                            >
                                <Github className="w-4 h-4" />
                                <span>GitHub</span>
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-dark-400 text-sm">
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className="ml-2 text-pink-400 font-semibold hover:text-pink-300 transition-colors"
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Bottom Decorative accents */}
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-600/10 rounded-full blur-[80px]" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
