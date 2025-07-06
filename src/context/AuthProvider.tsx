
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
  quizHistory: DocumentData[] | null;
  setQuizHistory: (history: DocumentData[]) => void;
  isHistoryLoading: boolean;
  setIsHistoryLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  quizHistory: null,
  setQuizHistory: () => {},
  isHistoryLoading: true,
  setIsHistoryLoading: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setUser(mockUser);
      setUserData(mockUserData);
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clear cached data if the user changes
      if (user?.uid !== currentUser?.uid) {
        setQuizHistory(null);
        setUserData(null);
      }
      setUser(currentUser);
      // The initial authentication check is complete.
      setLoading(false);
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only ONCE on mount to check auth state quickly.

  useEffect(() => {
    // This separate effect fetches user data without blocking the main `loading` state.
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.exists() ? doc.data() : null);
      }, (error) => {
        console.error("Firestore snapshot error:", error);
        setUserData(null);
      });
      
      return () => unsubscribeFirestore();
    }
  }, [user]);

  const value = { user, userData, loading, quizHistory, setQuizHistory, isHistoryLoading, setIsHistoryLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
