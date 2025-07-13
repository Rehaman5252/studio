
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { mockUserData, mockQuizHistory, type QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isHistoryLoading: boolean;
  updateUserData: (newData: Partial<DocumentData>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user object for demonstration purposes
  const mockUser: User = {
      uid: mockUserData.uid,
      email: mockUserData.email,
      emailVerified: mockUserData.emailVerified,
      displayName: mockUserData.displayName,
      photoURL: mockUserData.photoURL,
      // Add other required User properties with mock values
      isAnonymous: false,
      phoneNumber: null,
      providerData: [],
      providerId: 'password',
      tenantId: null,
      metadata: {},
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({} as any),
  };

  useEffect(() => {
    // We'll simulate a logged-in user with mock data
    // In a real app, you'd use onAuthStateChanged
    const timer = setTimeout(() => {
        setUser(mockUser);
        setUserData(mockUserData);
        setQuizHistory(mockQuizHistory);
        setLoading(false);
    }, 500); // Simulate loading delay

    return () => clearTimeout(timer);
  }, []);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    // Simulate updating user data in our mock state
    setUserData(prevData => {
        const updatedData = { ...prevData, ...newData };
        console.log("Mock user data updated:", updatedData);
        return updatedData;
    });
  }, []);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    // Simulate adding a quiz attempt to our mock history
    setQuizHistory(prevHistory => {
        const newHistory = [attempt, ...(prevHistory || [])];
        console.log("Mock quiz attempt added:", newHistory);
        return newHistory;
    });
    // Also update summary stats
    updateUserData({
        quizzesPlayed: (userData?.quizzesPlayed || 0) + 1,
        perfectScores: (userData?.perfectScores || 0) + (attempt.score === attempt.totalQuestions ? 1 : 0),
        totalRewards: (userData?.totalRewards || 0) + (attempt.score === attempt.totalQuestions ? 100 : 0)
    })
  }, [userData, updateUserData]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const value = {
    user,
    userData,
    quizHistory,
    isProfileComplete,
    loading,
    isUserDataLoading: loading,
    isHistoryLoading: loading,
    updateUserData,
    addQuizAttempt,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
