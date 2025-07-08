'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthProvider';
import { QuizStatusProvider } from '@/context/QuizStatusProvider';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QuizStatusProvider>
        {children}
        <Toaster />
      </QuizStatusProvider>
    </AuthProvider>
  );
}
