
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';

// This is a mock user object. In a real app, this would come from Firebase Auth.
const mockUser: User = {
    uid: 'example-user-id',
    email: 'user@example.com',
    emailVerified: true,
    displayName: 'Explorer User',
    isAnonymous: false,
    photoURL: 'https://placehold.co/100x100.png',
    providerData: [],
    metadata: {
      creationTime: new Date().toUTCString(),
      lastSignInTime: new Date().toUTCString(),
    },
    providerId: 'password',
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({
        token: 'mock-id-token',
        expirationTime: '',
        authTime: '',
        issuedAtTime: '',
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({}),
};

// This is mock user data. In a real app, this would come from Firestore.
const mockUserData: DocumentData = {
    uid: 'example-user-id',
    email: 'user@example.com',
    name: 'Explorer User',
    phone: '9876543210',
    age: '28',
    gender: 'Unspecified',
    occupation: 'Explorer',
    totalRewards: 500,
    highestStreak: 7,
    referralEarnings: 150,
    certificatesEarned: 2,
    quizzesPlayed: 15,
    upi: 'explorer@upi',
    referralCode: `indcric.com/ref/example`,
    createdAt: new Date().toISOString(),
    photoURL: 'https://placehold.co/100x100.png'
};

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // We provide the mock user and data directly, with no loading state.
  const value = {
    user: mockUser,
    userData: mockUserData,
    loading: false,
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
