
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  profile: DocumentData | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isOffline: boolean;
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
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const setupListener = async () => {
      setIsLoading(true);

      const online = await isFirebaseOnline();
      if (!online) {
        setIsOffline(true);
        setIsLoading(false);
        return;
      }

      const firestore = getFirebaseFirestore();
      if (!firestore) return;

      const userDocRef = doc(firestore, 'users', user.uid);

      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        setIsOffline(false);

        if (!docSnap.exists()) {
          await createUserDocument(user);
          return;
        }

        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }

        setProfile(data || null);
        setIsLoading(false);
      }, (error) => {
        console.error('Firestore error:', error);
        setIsOffline(true);
        setIsLoading(false);
      });

      return () => unsubscribe();
    };

    const unsubscribePromise = setupListener();
    
    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) throw new Error("No user or DB.");

    setProfile(prev => ({ ...prev, ...newData }));

    try {
      await setDoc(doc(firestore, 'users', user.uid), sanitizeUserProfile(newData), { merge: true });
    } catch (error) {
      console.error('updateUserData failed:', error);
      throw new Error("Profile save failed. Try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) throw new Error("User or Firestore unavailable.");

    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newStats = {
      quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
      perfectScores: (profile?.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (profile?.totalRewards || 0) + (isPerfect ? 100 : 0)
    };

    setProfile(prev => ({ ...prev, ...newStats }));

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, sanitizeUserProfile(newStats), { merge: true });

      const historyRef = doc(firestore, 'quizHistory', user.uid);
      const historySnap = await getDoc(historyRef);
      const history = historySnap.exists() ? historySnap.data().attempts : [];
      await setDoc(historyRef, { attempts: [sanitizeUserProfile(attempt), ...history] }, { merge: true });
    } catch (error) {
      console.error("addQuizAttempt failed:", error);
      throw error;
    }
  }, [user, profile]);

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(f => !!profile[f]);
  }, [profile]);

  const value = useMemo(() => ({
    user,
    userData: profile,
    profile,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading: isLoading,
    isUserDataLoading: isLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, profile, lastAttempt, isProfileComplete, isLoading, isOffline, updateUserData, addQuizAttempt]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
