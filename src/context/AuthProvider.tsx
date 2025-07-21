
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        setLoading(false);
        setIsOffline(true);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
        // No user, so we are done loading.
        setLoading(false);
        return;
    }

    // User is authenticated, now check for profile.
    setLoading(true);
    const db = getFirebaseFirestore();

    if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    getDoc(userDocRef)
      .then(async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          // If the document doesn't exist, create it.
          await createUserDocument(user);
          const newDocSnap = await getDoc(userDocRef); // Re-fetch after creation
          if (newDocSnap.exists()) {
            const data = newDocSnap.data();
             if (data?.dob instanceof Timestamp) {
                data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
            setProfile(data);
            setIsProfileComplete(!!data.profileCompleted);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching/creating user document:", error);
        setIsOffline(true); // Treat fetch errors as being offline
      })
      .finally(() => {
        setLoading(false);
      });
      
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    setProfile(prev => {
        const updated = { ...(prev || {}), ...newData };
        setIsProfileComplete(!!updated.profileCompleted);
        return updated;
    });
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, newData, { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = attempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    if (updateUserData) {
        const currentProfile = profile || {};
        const newStats = {
          quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
          perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
          totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        await updateUserData(newStats);
    }
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

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
