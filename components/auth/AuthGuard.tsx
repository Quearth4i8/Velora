'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { motion } from 'framer-motion';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-dark-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="z-10 text-center mb-6"
                >
                    <img
                        src="/images/velora.png"
                        alt="Velora Logo"
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-2xl shadow-pink-500/20"
                    />
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                        Velora <span className="gradient-text">AI</span>
                    </h1>
                    <p className="text-dark-400 text-base max-w-lg mx-auto">
                        The world's most advanced AI character creator.
                        Sign in to start your adventure.
                    </p>
                </motion.div>

                <div className="w-full max-w-md z-10">
                    <AuthModal
                        isOpen={true}
                        onClose={() => { }} // Non-closable when in guard mode
                        isFullPage={true}
                    />
                </div>

                <p className="mt-6 text-dark-500 text-xs z-10">
                    &copy; 2025 Velora AI. All rights reserved.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
