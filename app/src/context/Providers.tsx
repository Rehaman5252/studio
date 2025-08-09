'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthProvider';
import { QuizStatusProvider } from '@/context/QuizStatusProvider';
import { SettingsProvider } from '@/hooks/use-settings';
import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/providers/FirebaseProvider';

// This component composes all the providers for the application.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <SettingsProvider>
          <QuizStatusProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </QuizStatusProvider>
        </SettingsProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
}
