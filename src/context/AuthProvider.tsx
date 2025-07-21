
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  authLoading: boolean;
  firestoreReady: boolean;
  isOffline: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: React.Dispatch<React.SetStateAction<QuizAttempt | null>>;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  // 1. Listen to Auth State
  useEffect(() => {
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

  // 2. Listen to Firestore connection state and fetch profile
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve first
    if (!user) {
        setProfile(null);
        setFirestoreReady(false);
        return;
    };

    const db = getFirebaseFirestore();
    if (!db) {
        setFirestoreReady(false);
        setIsOffline(true);
        return;
    }

    // Use a dummy doc listener to confirm network connection is active
    const dummyDocRef = doc(db, '__status__', 'ping');
    const unsubscribeFirestore = onSnapshot(dummyDocRef, { includeMetadataChanges: true },
      (snapshot) => {
        setIsOffline(snapshot.metadata.fromCache);
        if (!snapshot.metadata.fromCache) {
          setFirestoreReady(true);
        }
      },
      (error) => {
        console.error("Firestore connection check failed:", error);
        setFirestoreReady(false);
        setIsOffline(true);
      }
    );
    
    // Fetch profile data once we have a user
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
        } else {
          // If doc doesn't exist, create it. The listener will then pick up the new doc.
          try {
            await createUserDocument(user);
          } catch(e) {
            console.error("Failed to create user document:", e)
          }
        }
    }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
    });


    return () => {
      unsubscribeFirestore();
      unsubscribeProfile();
    };
  }, [user, authLoading]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    setProfile(prev => ({ ...(prev || {}), ...newData }));
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

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
  
  const isProfileComplete = useMemo(() => !!profile?.profileCompleted, [profile]);
  const loading = authLoading || (!!user && !firestoreReady);

  const value = useMemo(() => ({
    user, profile, loading, authLoading, firestoreReady, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, authLoading, firestoreReady, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

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
