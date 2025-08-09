'use client';

import React from 'react';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { UserDataProvider } from './AuthProvider';
import { SettingsProvider } from '@/hooks/use-settings';
import { QuizStatusProvider } from './QuizStatusProvider';

// This component composes all the providers for the application.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <UserDataProvider>
        <SettingsProvider>
            <QuizStatusProvider>
                {children}
            </QuizStatusProvider>
        </SettingsProvider>
      </UserDataProvider>
    </FirebaseProvider>
  );
}
