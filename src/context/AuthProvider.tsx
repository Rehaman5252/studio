
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';
import { createUserDocument } from '@/lib/authUtils';

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
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Ensure user document exists before setting up listeners
        await createUserDocument(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      setIsUserDataLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
        setIsUserDataLoading(false);
      });

      setIsHistoryLoading(true);
      const historyDocRef = doc(db, 'quizHistory', user.uid);
      const unsubHistory = onSnapshot(historyDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setQuizHistory(data.attempts || []);
        } else {
          setQuizHistory([]);
        }
        setIsHistoryLoading(false);
      });

      return () => {
        unsubUser();
        unsubHistory();
      };
    } else {
      setUserData(null);
      setQuizHistory(null);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
    }
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      ...newData,
      updatedAt: serverTimestamp(),
    });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) return;
    const historyDocRef = doc(db, 'quizHistory', user.uid);
    
    try {
        const docSnap = await getDoc(historyDocRef);
        if (docSnap.exists()) {
            await updateDoc(historyDocRef, {
                attempts: arrayUnion(attempt)
            });
        } else {
            await setDoc(historyDocRef, { attempts: [attempt] });
        }

        // Also update the summary stats on the user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const currentData = userDocSnap.data();
            const isPerfect = attempt.score === attempt.totalQuestions;
            const newStats = {
                quizzesPlayed: (currentData.quizzesPlayed || 0) + 1,
                perfectScores: (currentData.perfectScores || 0) + (isPerfect ? 1 : 0),
                totalRewards: (currentData.totalRewards || 0) + (isPerfect ? 100 : 0)
            };
            await updateDoc(userDocRef, newStats);
        }

    } catch (error) {
        console.error("Error adding quiz attempt:", error);
    }

  }, [user]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const value = {
    user,
    userData,
    quizHistory,
    isProfileComplete,
    loading: loading || (!!user && (isUserDataLoading || isHistoryLoading)),
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
