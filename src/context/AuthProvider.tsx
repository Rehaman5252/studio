
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';
import { mockQuizHistory } from '@/lib/mockData';


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
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  quizHistory: null,
  isHistoryLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    // If firebase is not configured, use mock data and stop.
    if (!isFirebaseConfigured) {
      setUser(mockUser);
      setUserData(mockUserData);
      setQuizHistory(mockQuizHistory);
      setLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    if (!auth || !db) {
        setLoading(false);
        setIsHistoryLoading(false);
        return;
    }
    
    // This listener handles user authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Main loading is complete once we know if there's a user or not.
      if (loading) setLoading(false);
      
      // If user logs out, clear their data.
      if (!currentUser) {
        setUserData(null);
        setQuizHistory(null);
        setIsHistoryLoading(false);
      }
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // This listener fetches and subscribes to the user's profile data.
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.exists() ? doc.data() : null);
    }, (error) => {
        console.error("Firestore user data snapshot error:", error);
        setUserData(null);
    });
    
    // This function fetches the user's quiz history once.
    const loadHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const historyCollection = collection(db, 'users', user.uid, 'quizHistory');
            const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const fetchedHistory = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
            setQuizHistory(fetchedHistory);
        } catch (error) {
            console.error("Failed to fetch quiz history:", error);
            setQuizHistory([]); // Set to empty array on error
        } finally {
            setIsHistoryLoading(false);
        }
    };
    
    // Only fetch history if we don't have it yet for this user.
    if (quizHistory === null) {
        loadHistory();
    }

    return () => unsubscribeFirestore();
  }, [user, db, quizHistory]);

  const value = { user, userData, loading, quizHistory, isHistoryLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
