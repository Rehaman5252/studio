
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
import { auth, db } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
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
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false; // Default to online during SSR
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // User is logged in, now we handle their document.
        setIsUserDataLoading(true);
        // This ensures db is ready when we call createUserDocument
        await createUserDocument(firebaseUser); 
      } else {
        // User is logged out
        setProfile(null);
        setIsUserDataLoading(false);
      }
      setIsLoading(false);
    });

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      // No user, no profile to listen to.
      setIsUserDataLoading(false);
      return;
    };

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        // This case is handled by onAuthStateChanged, but as a fallback:
        setProfile(null);
      }
      setIsUserDataLoading(false);
    }, (error) => {
      console.error('Firestore profile snapshot error:', error);
      if (error.code === 'unavailable') setIsOffline(true);
      setIsUserDataLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<any>) => {
    if (!user) throw new Error("User not authenticated.");

    const sanitizedData = sanitizeUserProfile(newData);
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, sanitizedData, { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const currentUserProfile = userDocSnap.exists() ? userDocSnap.data() : {};

    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newStats = {
      quizzesPlayed: (currentUserProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentUserProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentUserProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });

    const historyDocRef = doc(db, 'quizHistory', user.uid);
    const historySnap = await getDoc(historyDocRef);
    const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
    const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];

    await setDoc(historyDocRef, { attempts: newHistory });

  }, [user]);

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!profile[field]);
  }, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading: isLoading,
    isUserDataLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, profile, lastAttempt, isProfileComplete, isLoading, isUserDataLoading, isOffline, updateUserData, addQuizAttempt]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
