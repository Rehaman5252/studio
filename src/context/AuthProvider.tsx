
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useSafeFirestore } from '@/hooks/useSafeFirestore';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, firestore, loading: authLoading } = useSafeFirestore();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }
    if (!firestore) {
      setIsOffline(true);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    setIsOffline(false);

    const userDocRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        try {
          await createUserDocument(user);
        } catch (e) {
          console.error("Failed to create user document:", e);
        }
      }
      setIsProfileLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setIsOffline(true);
      setIsProfileLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, authLoading]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user || !firestore) throw new Error("User not authenticated or database not available.");
    
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user, firestore]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !firestore) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(firestore, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    if (updateUserData) {
      const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
      const newStats = {
        quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
        perfectScores: (profile?.perfectScores || 0) + (isPerfect ? 1 : 0),
        totalRewards: (profile?.totalRewards || 0) + (isPerfect ? 100 : 0),
      };
      await updateUserData(newStats);
    }
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, firestore, updateUserData]);
  
  const isProfileComplete = useMemo(() => !!profile?.profileCompleted, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading: authLoading || isProfileLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
    lastAttempt,
    setLastAttempt,
    isProfileComplete
  }), [user, profile, authLoading, isProfileLoading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
