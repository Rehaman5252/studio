
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';
import {
  doc,
  setDoc,
  Timestamp,
  getDoc,
  collection
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
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
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return !navigator.onLine;
    return false; // assume online during SSR
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setIsLoading(false);
      setIsUserDataLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
        setIsUserDataLoading(false);
        return;
    }
    if (!user) {
      setProfile(null);
      setIsUserDataLoading(false);
      return;
    }

    setIsUserDataLoading(true);

    const fetchProfile = async () => {
      if (!db) {
          setIsUserDataLoading(false);
          return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          await createUserDocument(user);
          const newSnap = await getDoc(userDocRef);
          if (newSnap.exists()) {
            setProfile(newSnap.data());
          }
        } else {
          const data = docSnap.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data || null);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setProfile(null);
      } finally {
        setIsUserDataLoading(false);
      }
    };

    fetchProfile();
  }, [user, isOffline]);

  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user || !db) {
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
    if (!user || !db) {
      throw new Error("User not authenticated or DB not available.");
    }
    
    try {
        const currentProfile = profile || {};
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        const newStats = {
            quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
            perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
            totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        
        // Optimistically update local state first
        setProfile(prev => ({ ...prev, ...newStats }));

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });

        const userAttemptsCollection = collection(db, `users/${user.uid}/quizAttempts`);
        const attemptRef = doc(userAttemptsCollection, attempt.timestamp.toString());
        await setDoc(attemptRef, sanitizeUserProfile(attempt));
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
    profile,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading: isLoading,
    isUserDataLoading: isUserDataLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, profile, lastAttempt, isProfileComplete, isLoading, isUserDataLoading, isOffline, updateUserData, addQuizAttempt]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
