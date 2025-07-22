
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
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
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Fetched profile will set loading to false in the next useEffect
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user === null) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Don't start fetching profile until user object is confirmed
    setLoading(true);
    let unsubProfile: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) {
          console.warn("Client is offline. Profile data will not be loaded.");
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        
        // Ensure document exists before subscribing
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            await createUserDocument(user);
        }

        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.dob instanceof Timestamp) {
              data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
            setProfile(data);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          if (error.code === "unavailable") {
            setIsOffline(true);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error("Error setting up user listener:", err);
        setIsOffline(true);
        setLoading(false);
      }
    };
    
    setupListener();

    return () => {
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const userDocRef = doc(db, "users", user.uid);
    const sanitizedData = sanitizeUserProfile(newData);
    await setDoc(userDocRef, sanitizedData, { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);
    
    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const currentProfile = profile || {};
    const newStats = {
      quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    try {
        await updateUserData(newStats);
        await setDoc(attemptRef, sanitizedAttempt, { merge: true });
    } catch (err) {
        console.error("Failed to save quiz attempt:", err);
        if ((err as any).code === 'unavailable') {
            alert("You appear to be offline. Your quiz results could not be saved.");
        }
    }
  }, [user, profile, updateUserData]);
  
  const isProfileComplete = !!profile?.profileCompleted;

  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
