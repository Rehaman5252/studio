'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { QuizStatusProvider } from './QuizStatusProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <AuthProvider>
          <QuizStatusProvider>
            {children}
            <Toaster />
          </QuizStatusProvider>
        </AuthProvider>
    </Suspense>
  );
}
