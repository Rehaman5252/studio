'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

// This is a mock user object.
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

// This is mock user data.
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
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, use mock data and finish loading.
    if (!isFirebaseConfigured || !auth || !db) {
      setUser(mockUser);
      setUserData(mockUserData);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null); // User document doesn't exist yet
        }
      });
      
      return () => unsubscribe();
    } else {
      setUserData(null); // No user, no data
    }
  }, [user]);

  const value = { user, userData, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
