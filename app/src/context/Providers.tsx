'use client';

import React from 'react';
import { UserDataProvider } from './AuthProvider';
import { SettingsProvider } from '@/hooks/use-settings';
import { QuizStatusProvider } from './QuizStatusProvider';
import { ThemeProvider } from 'next-themes';

// This component composes all the providers for the application.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
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
    </UserDataProvider>
  );
}
