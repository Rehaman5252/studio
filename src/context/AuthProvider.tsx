'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, firebaseApp } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  firestoreReady: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [firestoreReady, setFirestoreReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = getFirebaseAuth();
    if (!auth) {
        setAuthLoading(false);
        setFirestoreReady(false);
        setIsOffline(true);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setAuthLoading(false);
    });
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    let unsubProfile: Unsubscribe | undefined;
    let unsubFirestore: Unsubscribe | undefined;

    if (user) {
        const db = getFirebaseFirestore();
        if (db) {
            // Dummy listener to check Firestore connection
            const dummyDocRef = doc(db, '__status__/ping');
            unsubFirestore = onSnapshot(dummyDocRef, () => {
                setFirestoreReady(true);
                setIsOffline(false);
            }, (error) => {
                console.error("Firestore connection error, you might be offline.", error);
                setFirestoreReady(false);
                setIsOffline(true);
            });

            // Profile listener
            const userDocRef = doc(db, 'users', user.uid);
            unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data?.dob instanceof Timestamp) {
                        data.dob = data.dob.toDate().toISOString().split('T')[0];
                    }
                    setProfile(data);
                    setIsProfileComplete(!!data.profileCompleted);
                } else {
                    await createUserDocument(user);
                }
            }, (error) => {
                 console.error("Profile listener error:", error);
                 setIsOffline(true);
            });

        } else {
            setFirestoreReady(false);
            setIsOffline(true);
        }
    } else {
      // No user, so reset states
      setProfile(null);
      setIsProfileComplete(false);
      setFirestoreReady(false);
    }
    
    return () => {
        if (unsubProfile) unsubProfile();
        if (unsubFirestore) unsubFirestore();
    };
  }, [user, authLoading]);
  

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    if (updateUserData && profile) {
        const newStats = {
          quizzesPlayed: (profile.quizzesPlayed || 0) + 1,
          perfectScores: (profile.perfectScores || 0) + (isPerfect ? 1 : 0),
          totalRewards: (profile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        await updateUserData(newStats);
    }
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);
  
  const value = useMemo(() => ({
    user, profile, loading: authLoading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, firestoreReady
  }), [user, profile, authLoading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, firestoreReady]);

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
