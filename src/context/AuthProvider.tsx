
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
  updateUserData: (newData: Partial<DocumentData>) => void;
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
  
  const updateUserData = (newData: Partial<DocumentData>) => {
    setUserData(prevData => ({ ...prevData, ...newData }));
  };
  
  // No-op useEffects as we are using mock data
  useEffect(() => {
    // This would handle real auth state changes
  }, []);

  const calculatedStats = useMemo(() => {
    if (!quizHistory) return { quizzesPlayed: 0, perfectScores: 0, totalRewards: 0 };

    const quizzesPlayed = quizHistory.length;
    const perfectScores = quizHistory.filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0).length;
    
    // Assuming 100 for each perfect score
    const scoreRewards = perfectScores * 100;
    const referralEarnings = userData?.referralEarnings || 0;
    const totalRewards = scoreRewards + referralEarnings;

    return { quizzesPlayed, perfectScores, totalRewards };
  }, [quizHistory, userData?.referralEarnings]);

  const enhancedUserData = useMemo(() => {
    if (!userData) return null;
    return {
      ...userData,
      ...calculatedStats,
    };
  }, [userData, calculatedStats]);

  // Unified loading flag, always false with mock data
  const loading = useMemo(() => {
    return !isAuthResolved || (user?.uid && (isUserDataLoading || isHistoryLoading));
  }, [isAuthResolved, user?.uid, isUserDataLoading, isHistoryLoading]);

  // Profile completeness check
  const isProfileComplete = useMemo(() => {
    if (!userData) {
      console.log('❌ userData is null');
      return false;
    }

    const missingFields = MANDATORY_PROFILE_FIELDS.filter(field => userData[field] == null);
    if (missingFields.length > 0) {
      console.log('❌ Missing profile fields:', missingFields);
      return false;
    }

    console.log('✅ Profile complete!');
    return true;
  }, [userData]);

  const value = {
    user,
    userData: enhancedUserData,
    quizHistory,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isHistoryLoading,
    updateUserData,
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
