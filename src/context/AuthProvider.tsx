'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { mockQuizHistory as mockHistoryData } from '@/lib/mockData';

// --- Default Mock User ---
const mockUser = {
  uid: 'mock-user-123',
  displayName: 'IndCric Player',
  email: 'mock.player@indcric.app',
  photoURL: 'https://placehold.co/100x100.png',
  emailVerified: true,
} as User;

const mockUserData = {
    uid: 'mock-user-123',
    name: 'IndCric Player',
    email: 'mock.player@indcric.app',
    phone: '9876543210',
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    photoURL: 'https://placehold.co/100x100.png',
    emailVerified: true,
    phoneVerified: true,
    totalRewards: 1500,
    quizzesPlayed: 15,
    perfectScores: 4,
    referralCode: 'indcric.app/ref/mock123',
    dob: '1990-01-01',
    gender: 'Male',
    occupation: 'Employee',
    upi: 'mock.player@upi',
    highestStreak: 5,
    certificatesEarned: 2,
    referralEarnings: 250,
    favoriteFormat: 'T20',
    favoriteTeam: 'India',
    favoriteCricketer: 'Virat Kohli',
};
// --- END MOCK ---

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
  isUserDataLoading: boolean;
  quizHistory: DocumentData[] | null;
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  userData: mockUserData,
  loading: false,
  isUserDataLoading: false,
  quizHistory: mockHistoryData,
  isHistoryLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value = { 
    user: mockUser,
    userData: mockUserData,
    loading: false,
    isUserDataLoading: false,
    quizHistory: mockHistoryData,
    isHistoryLoading: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
