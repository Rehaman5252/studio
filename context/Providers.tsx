
'use client';

import React from 'react';
import { UserDataProvider } from '@/context/AuthProvider';
import { QuizStatusProvider } from '@/context/QuizStatusProvider';
import { SettingsProvider } from '@/hooks/use-settings';
import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/providers/FirebaseProvider';

// This component composes all the providers for the application.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SettingsProvider>
        <FirebaseProvider>
          <UserDataProvider>
            <QuizStatusProvider>
              {children}
            </QuizStatusProvider>
          </UserDataProvider>
        </FirebaseProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
