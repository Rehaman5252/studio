
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
  collection,
} from 'firebase/firestore';

import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { auth, db } from '@/lib/firebaseClient';
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
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false; // Default to online during SSR
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    }
    
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        }
        unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
        setIsLoading(false);
        return;
    }
    
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const userDocRef = doc(db, 'users', user.uid);
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
  }, [user, isOffline]);

  const updateUserData = useCallback(async (newData: Partial<any>) => {
    if (!user) {
      throw new Error("Could not save profile. Please check your connection and try again.");
    }

    setProfile(prev => ({ ...prev, ...newData }));
    const sanitizedData = sanitizeUserProfile(newData);

    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("updateUserData error:", err);
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated or DB not available.");

    // Store the full attempt in a scalable subcollection
    try {
        const userAttemptsCollectionRef = collection(db, 'users', user.uid, 'quizAttempts');
        // Use a unique ID for each attempt, timestamp is a good candidate
        const attemptRef = doc(userAttemptsCollectionRef, attempt.timestamp.toString());
        await setDoc(attemptRef, sanitizeUserProfile(attempt));
    } catch (error) {
        console.error("Error adding quiz attempt to subcollection:", error);
        throw error;
    }

    // Update summary stats on the main user document
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newStats = {
      quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
      perfectScores: (profile?.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (profile?.totalRewards || 0) + (isPerfect ? 100 : 0),
    };

    setProfile(prev => ({ ...prev, ...newStats }));

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });
    } catch (error) {
        console.error("Error updating user summary stats:", error);
        // Don't rethrow here, as the primary data was already saved.
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
