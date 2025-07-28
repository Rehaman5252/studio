'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { QuizStatusProvider } from './QuizStatusProvider';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { SettingsProvider } from '@/hooks/use-settings.tsx';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <SettingsProvider>
        <AuthProvider>
          <QuizStatusProvider>
            {children}
            <Toaster />
          </QuizStatusProvider>
        </AuthProvider>
      </SettingsProvider>
    </FirebaseProvider>
  );
}
