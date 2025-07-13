
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { mockUserData, mockQuizHistory, type QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(mockUserData as any);
  const [userData, setUserData] = useState<DocumentData | null>(mockUserData);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(mockQuizHistory);

  const [isAuthResolved, setIsAuthResolved] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  // No-op useEffects as we are using mock data
  useEffect(() => {
    // This would handle real auth state changes
  }, []);

  // Unified loading flag, always false with mock data
  const loading = useMemo(() => {
    return !isAuthResolved || (user?.uid && (isUserDataLoading || isHistoryLoading));
  }, [isAuthResolved, user?.uid, isUserDataLoading, isHistoryLoading]);

  // Profile completeness check
  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    // Use `userData[field] == null` to allow empty strings `""` but not `null` or `undefined`.
    return MANDATORY_PROFILE_FIELDS.every((field) => userData[field] != null);
  }, [userData]);

  const value = {
    user,
    userData,
    quizHistory,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isHistoryLoading,
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
