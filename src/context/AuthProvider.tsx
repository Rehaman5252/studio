
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  firebaseAppReady: boolean;
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
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [firebaseAppReady, setFirebaseAppReady] = useState(false);

  useEffect(() => {
    // This effect ensures Firebase is initialized on the client before anything else runs.
    if (typeof window !== 'undefined') {
      getFirebaseAuth(); // This initializes the app if not already done.
      setFirebaseAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (!firebaseAppReady) return;

    const auth = getFirebaseAuth();
    if (!auth) {
        console.error("Firebase Auth is not available.");
        setLoading(false);
        setIsOffline(true);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setLoading(true); // Always set loading true when auth state might be changing.
        setUser(firebaseUser);
        if (!firebaseUser) {
            setProfile(null);
            setIsProfileComplete(false);
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, [firebaseAppReady]);

  useEffect(() => {
    if (!firebaseAppReady) return;
    if (!user) {
        if(loading) setLoading(false); // If auth state is resolved to null, stop loading.
        return;
    }

    let unsubProfile: (() => void) | undefined = undefined;
    const db = getFirebaseFirestore();
    
    if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
    }

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
            // Document doesn't exist, so create it.
            try {
                await createUserDocument(user);
                // The snapshot listener will trigger again with the new data,
                // so we don't need to set profile state here.
            } catch (error) {
                console.error("Failed to create user document:", error);
                setIsOffline(true);
            }
        }
        setLoading(false);
    }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
        setLoading(false);
    });

    return () => {
        if (unsubProfile) unsubProfile();
    };
  }, [user, firebaseAppReady, loading]);

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
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, firebaseAppReady
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, firebaseAppReady]);

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
