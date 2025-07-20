
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const db = getFirebaseFirestore();
        if (!db) throw new Error("Firestore not initialized");
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) { setLoading(false); return; }
        const ref = doc(db, "users", user.uid);
        const userDoc = await getDoc(ref);
        if (!userDoc.exists()) {
          await createUserDocument(user);
          const newUserDoc = await getDoc(ref);
          if (newUserDoc.exists()) {
             setProfile(newUserDoc.data());
          }
        } else {
          const data = userDoc.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split("T")[0];
          }
          setProfile(data);
        }
      } catch (e) {
        setIsOffline(true); setProfile(null);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User or DB not available");
    setProfile(prev => ({ ...prev, ...newData }));
    await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, "users", user.uid, "quizAttempts", sanitizedAttempt.slotId);

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
  }, [user, profile, updateUserData]);

  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt]);

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
