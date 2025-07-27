
'use client';

import type { ReactNode } from 'react';
import { UserDataProvider } from '@/context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { QuizStatusProvider } from './QuizStatusProvider';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { SettingsProvider } from '@/hooks/use-settings.tsx';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <SettingsProvider>
        <UserDataProvider>
          <QuizStatusProvider>
            {children}
            <Toaster />
          </QuizStatusProvider>
        </UserDataProvider>
      </SettingsProvider>
    </FirebaseProvider>
  );
}
