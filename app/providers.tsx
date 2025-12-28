'use client';

import React from 'react';
import { DialogProvider } from '@/components/ui/DialogProvider';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <DialogProvider>{children}</DialogProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
