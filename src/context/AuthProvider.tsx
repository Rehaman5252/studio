
'use client';

import type { User } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';

import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { getFirebaseAuth, getFirebaseFirestore, isReallyOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  profile: any | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isOffline: boolean;
  updateUserData?: (newData: Partial<any>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer',
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

    const init = async () => {
      setIsLoading(true);
      const firestore = getFirebaseFirestore();
      const isOnline = await isReallyOnline();

      if (!firestore || !isOnline) {
        setIsOffline(true);
        setIsLoading(false);
        return;
      }

      setIsOffline(false);
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (!docSnap.exists()) {
          createUserDocument(user).catch(console.error);
        } else {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data || null);
        }
        setIsLoading(false);
      }, (error) => {
        console.error('Firestore error:', error);
        if (error.code === 'unavailable') setIsOffline(true);
        setIsLoading(false);
      });

      return () => unsubscribe();
    };

    init();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<any>) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) {
      throw new Error("Could not save profile. Please check your connection and try again.");
    }

    setProfile(prev => ({ ...prev, ...newData }));
    const sanitizedData = sanitizeUserProfile(newData);

    try {
      const ref = doc(firestore, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("updateUserData error:", err);
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) throw new Error("User not authenticated or DB not available.");

    const currentUserProfile = profile ? { ...profile } : {};

    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newStats = {
      quizzesPlayed: (currentUserProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentUserProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentUserProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };

    setProfile(prev => ({ ...prev, ...newStats }));

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });

      const historyDocRef = doc(firestore, 'quizHistory', user.uid);
      const historySnap = await getDoc(historyDocRef);
      const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
      const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];

      await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });
    } catch (error) {
      console.error("Error adding quiz attempt:", error);
      throw error;
    }
  }, [user, profile]);

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!profile[field]);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
