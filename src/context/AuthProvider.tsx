'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, type DocumentData } from 'firebase/firestore';

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
  user: null,
  userData: null,
  loading: true,
  isUserDataLoading: true,
  quizHistory: null,
  isHistoryLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  // Hardcoded mock user data and loading states as auth is disabled
  const user = mockUser;
  const userData = mockUserData;
  const loading = false;
  const isUserDataLoading = false;

  useEffect(() => {
    // This effect establishes a real-time listener for the mock user's quiz history.
    const uid = mockUser.uid;
    if (!db) {
        console.warn("Firestore not available, can't fetch quiz history in real-time.");
        setIsHistoryLoading(false);
        return;
    }

    const historyRef = collection(db, 'users', uid, 'quizHistory');
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    
    // onSnapshot creates a real-time subscription to the query.
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyData: DocumentData[] = [];
        snapshot.forEach((doc) => {
            historyData.push({ ...doc.data(), id: doc.id });
        });
        setQuizHistory(historyData);
        setIsHistoryLoading(false);
    }, (error) => {
        console.error("Error fetching quiz history in real-time:", error);
        setIsHistoryLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  const value = { 
    user,
    userData,
    loading,
    isUserDataLoading,
    quizHistory,
    isHistoryLoading,
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
