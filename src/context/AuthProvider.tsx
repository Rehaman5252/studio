
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
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
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
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false; // Default to online during SSR
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const auth = getFirebaseAuth();
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
      try {
        const firestore = getFirebaseFirestore();
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          await createUserDocument(user); // This now handles its own DB instance
          // After creation, we fetch it again to ensure we have the stored data
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
        setIsOffline(true); // Treat fetch errors as being offline
        setProfile(null);
      } finally {
        setIsUserDataLoading(false);
      }
    };

    fetchProfile();
  }, [user, isOffline]);

  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) {
      throw new Error("Could not save profile. Please check your connection and try again.");
    }

    const firestore = getFirebaseFirestore();
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
    if (!user) {
      throw new Error("User not authenticated or DB not available.");
    }
    const firestore = getFirebaseFirestore();
    
    // Optimistically update local profile state for immediate UI feedback
    setProfile(prev => {
      const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
      return {
        ...prev,
        quizzesPlayed: (prev?.quizzesPlayed || 0) + 1,
        perfectScores: (prev?.perfectScores || 0) + (isPerfect ? 1 : 0),
        totalRewards: (prev?.totalRewards || 0) + (isPerfect ? 100 : 0)
      };
    });

    try {
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        const currentProfile = profile || {};
        const newStats = {
            quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
            perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
            totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });

        const userAttemptsCollection = collection(firestore, `users/${user.uid}/quizAttempts`);
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
    userData: profile,
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
