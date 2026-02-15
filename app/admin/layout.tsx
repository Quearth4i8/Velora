'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useAuth } from '@/context/AuthContext';
import { characterAPI } from '@/lib/api';
import { 
  LayoutDashboard, Users, Film, Sparkles, Shield, 
  ChevronLeft, LogOut, Menu, X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check admin status
  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    const result = await characterAPI.checkIsAdmin();
    setIsAdmin(result.isAdmin);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-dark-400">You do not have permission to access the admin panel.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/videos', label: 'Video Requests', icon: Film },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/special', label: 'Special Characters', icon: Sparkles },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <AnimatedBackground />
      
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Admin</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-dark-300 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`fixed lg:sticky lg:top-0 left-0 z-40 w-72 h-[calc(100vh-60px)] lg:h-screen bg-dark-900/95 backdrop-blur-xl border-r border-white/5 overflow-y-auto ${
                isSidebarOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Logo - Desktop only */}
              <div className="hidden lg:flex items-center gap-3 p-6 border-b border-white/5">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-dark-400">Velora Management</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Main
                </p>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                <div className="my-4 border-t border-white/5" />
                
                <p className="px-4 py-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Other
                </p>
                
                <Link
                  href="/"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Site</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>

              {/* User Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3 bg-dark-800/50 rounded-xl">
                  <img
                    src={user?.user_metadata?.avatar_url || '/images/velora.png'}
                    alt="Admin"
                    className="w-10 h-10 rounded-full bg-dark-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-pink-400">Administrator</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-60px)] lg:min-h-screen overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
