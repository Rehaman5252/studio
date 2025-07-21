
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { firebaseAuth, firestore } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  authLoading: boolean;
  firestoreReady: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: React.Dispatch<React.SetStateAction<QuizAttempt | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setFirestoreReady(false); // No user, no need for firestore readiness
      return;
    }

    let unsubProfile: Unsubscribe | undefined;
    let unsubFirestore: Unsubscribe | undefined;

    const userDocRef = doc(firestore, 'users', user.uid);
    unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        await createUserDocument(user);
      }
    });

    // Dummy listener to confirm network connection is active
    const dummyDocRef = doc(firestore, '__status__', 'ping');
    unsubFirestore = onSnapshot(dummyDocRef, { includeMetadataChanges: true }, 
      (snapshot) => {
        if (!snapshot.metadata.fromCache) {
          setFirestoreReady(true);
        }
      }, (error) => {
        console.error("Firestore connection check failed:", error);
        setFirestoreReady(false);
      }
    );

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubFirestore) unsubFirestore();
    };
  }, [user, authLoading]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    setProfile(prev => ({ ...(prev || {}), ...newData }));
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(firestore, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const currentProfile = profile || {};
    const newStats = {
      quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    await updateUserData(newStats);
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);

  const loading = authLoading || (!!user && !firestoreReady);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    authLoading,
    firestoreReady,
    updateUserData,
    addQuizAttempt,
    lastAttempt,
    setLastAttempt,
  }), [user, profile, loading, authLoading, firestoreReady, updateUserData, addQuizAttempt, lastAttempt]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
