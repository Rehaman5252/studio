
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
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
  updateUserData?: (newData: Partial<DocumentData>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
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
    if (!isFirebaseConfigured) {
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    const authSub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (!currentUser) {
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
    });

    return () => authSub();
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    let unsubscribeUser: () => void;
    let unsubscribeHistory: () => void;

    // This function will only be called when `user` is confirmed to exist.
    const setupListeners = () => {
        try {
            setIsUserDataLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("User document doesn't exist, creating...");
                    createUserDocument(user);
                }
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

            setIsHistoryLoading(true);
            const historyDocRef = doc(db, 'quizHistory', user.uid);
            unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setQuizHistory(data.attempts || []);
                } else {
                    setQuizHistory([]);
                }
                setIsHistoryLoading(false);
            }, (error) => {
                console.error("Error listening to quiz history:", error);
                setIsHistoryLoading(false);
            });
        } catch (error) {
            console.error("Failed to set up Firestore listeners:", error);
            setIsUserDataLoading(false);
            setIsHistoryLoading(false);
        }
    };
    
    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) throw new Error("User not authenticated");
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, newData);
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated");
    
    const currentHistory = quizHistory || [];
    const currentUserData = userData || {};

    const historyDocRef = doc(db, 'quizHistory', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    
    const newHistory = [attempt, ...currentHistory];
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newQuizzesPlayed = (currentUserData?.quizzesPlayed || 0) + 1;
    const newPerfectScores = (currentUserData?.perfectScores || 0) + (isPerfect ? 1 : 0);
    const newTotalRewards = (currentUserData?.totalRewards || 0) + (isPerfect ? 100 : 0);

    const userUpdatePayload = {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards
    };

    try {
        await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });
        await updateDoc(userDocRef, userUpdatePayload);
    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, quizHistory, userData]);

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
