
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthProvider';


// This is the correct hook that should be used throughout the application.
// It consumes the context provided by UserDataProvider.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserDataProvider');
  }
  return context;
};
