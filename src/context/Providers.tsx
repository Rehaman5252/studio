
'use client';

import type { ReactNode } from 'react';
import { UserDataProvider } from '@/context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { QuizStatusProvider } from './QuizStatusProvider';
import { FirebaseProvider } from '@/providers/FirebaseProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <FirebaseProvider>
          <UserDataProvider>
            <QuizStatusProvider>
              {children}
              <Toaster />
            </QuizStatusProvider>
          </UserDataProvider>
        </FirebaseProvider>
    </Suspense>
  );
}
