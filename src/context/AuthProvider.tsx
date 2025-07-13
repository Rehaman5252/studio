
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { DocumentData } from 'firebase/firestore';
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
  addQuizAttempt: (attempt: QuizAttempt) => void;
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

  // Since this is a demo with a permanent mock user, loading states are always false.
  const isUserDataLoading = false;
  const isHistoryLoading = false;
  
  const updateUserData = useCallback((newData: Partial<DocumentData>) => {
    setUserData(prevData => ({ ...prevData, ...newData }));
  }, []);
  
  const addQuizAttempt = useCallback((attempt: QuizAttempt) => {
    setQuizHistory(prevHistory => {
        const newHistory = [attempt, ...(prevHistory || [])];
        return newHistory;
    });
  }, []);
  
  const calculatedStats = useMemo(() => {
    if (!quizHistory) return { quizzesPlayed: 0, perfectScores: 0, totalRewards: 0 };

    const quizzesPlayed = quizHistory.length;
    const perfectScores = quizHistory.filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0 && !attempt.reason).length;
    
    // Assuming 100 for each perfect score
    const scoreRewards = perfectScores * 100;
    const referralEarnings = userData?.referralEarnings || 0;
    const totalRewards = scoreRewards + referralEarnings;

    return { quizzesPlayed, perfectScores, totalRewards };
  }, [quizHistory, userData?.referralEarnings]);

  const enhancedUserData = useMemo(() => {
    if (!userData) return null;
    
    const newStats = calculatedStats;
    if (
      userData.quizzesPlayed !== newStats.quizzesPlayed ||
      userData.perfectScores !== newStats.perfectScores ||
      userData.totalRewards !== newStats.totalRewards
    ) {
      return {
        ...userData,
        ...newStats
      };
    }
    
    return userData;

  }, [userData, calculatedStats]);
  
  useEffect(() => {
      setUserData(enhancedUserData);
  }, [enhancedUserData]);

  const loading = false; // Never in a loading state for the demo account

  const isProfileComplete = useMemo(() => {
    if (!userData) {
      return false;
    }
    const missingFields = MANDATORY_PROFILE_FIELDS.filter(field => !userData[field]);
    return missingFields.length === 0;
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
