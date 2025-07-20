
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
  collection,
} from 'firebase/firestore';
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
  
  const [isOffline, setIsOffline] = useState(() => {
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
    
    const auth = getFirebaseAuth();
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
    if (typeof window === "undefined") return;
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const fetchProfile = async () => {
      try {
        const firestore = getFirebaseFirestore();
        if (!firestore) throw new Error("Firestore not initialized.");
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) {
          setIsLoading(false);
          return;
        }
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          await createUserDocument(user);
          // After creation, fetch again to get the new profile
          const newDocSnap = await getDoc(userDocRef);
          if (newDocSnap.exists()) {
            setProfile(newDocSnap.data());
          }
        } else {
          const data = docSnap.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data || null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        setIsOffline(true);
        setProfile(null);
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Optimistic profile updates
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) {
      console.error("updateUserData: No user or DB not available.");
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
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;

    // Optimistically update the local profile state
    setProfile(prev => {
      if (!prev) return null; // Should not happen if a user is logged in
      const newStats = {
        quizzesPlayed: (prev.quizzesPlayed || 0) + 1,
        perfectScores: (prev.perfectScores || 0) + (isPerfect ? 1 : 0),
        totalRewards: (prev.totalRewards || 0) + (isPerfect ? 100 : 0)
      };
      return { ...prev, ...newStats };
    });

    try {
      // Update summary stats on the main user document
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const currentProfile = userDocSnap.data() || {};
      
      const newStats = {
        quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
        perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
        totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0)
      };
      
      await setDoc(userDocRef, sanitizeUserProfile(newStats), { merge: true });

      // Store the full attempt in a scalable subcollection
      const userAttemptsCollectionRef = collection(firestore, 'users', user.uid, 'quizAttempts');
      const attemptRef = doc(userAttemptsCollectionRef, attempt.slotId); // Use slotId as a unique identifier for the attempt
      await setDoc(attemptRef, sanitizeUserProfile(attempt));

    } catch (error) {
      console.error("Error adding quiz attempt:", error);
      // Optionally, revert the optimistic update here
      throw error;
    }
  }, [user]);

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
