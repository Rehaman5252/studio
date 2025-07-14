
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData, DocumentReference } from 'firebase/firestore';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { createUserDocument } from '@/lib/authUtils';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
      if (!user) {
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setIsUserDataLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          // If user exists in Auth but not Firestore, create their doc
          createUserDocument(user);
        }
        setIsUserDataLoading(false);
      });

      setIsHistoryLoading(true);
      const historyDocRef = doc(db, 'quizHistory', user.uid);
      const unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // The history is stored in a field, e.g., 'attempts'
          setQuizHistory(data.attempts || []);
        } else {
          setQuizHistory([]);
        }
        setIsHistoryLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeHistory();
      };
    }
  }, [user]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userDocRef, newData);
    } catch (error) {
        console.error("Error updating user data:", error);
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) return;

    const historyDocRef = doc(db, 'quizHistory', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    
    // Using a function with setQuizHistory to ensure we have the latest state
    setQuizHistory(currentHistory => {
        const newHistory = [attempt, ...(currentHistory || [])];
        setDoc(historyDocRef, { attempts: newHistory }, { merge: true });
        return newHistory;
    });

    setUserData(currentUserData => {
        const newQuizzesPlayed = (currentUserData?.quizzesPlayed || 0) + 1;
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        const newPerfectScores = (currentUserData?.perfectScores || 0) + (isPerfect ? 1 : 0);
        const newTotalRewards = (currentUserData?.totalRewards || 0) + (isPerfect ? 100 : 0);
        
        const updatedStats = {
            quizzesPlayed: newQuizzesPlayed,
            perfectScores: newPerfectScores,
            totalRewards: newTotalRewards
        };

        updateDoc(userDocRef, updatedStats);
        
        return { ...currentUserData, ...updatedStats };
    });

  }, [user]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const loading = isAuthLoading || isUserDataLoading || isHistoryLoading;

  const value = useMemo(() => ({
    user,
    userData,
    quizHistory,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isHistoryLoading,
    updateUserData,
    addQuizAttempt,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, updateUserData, addQuizAttempt]);

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
