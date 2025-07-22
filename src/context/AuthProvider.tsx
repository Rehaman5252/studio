
'use client';
/**
 * @fileOverview AuthProvider
 *
 * This is the central provider for the user's authentication state and core profile.
 * It follows a lean data-loading strategy to ensure fast initial page loads.
 *
 * 1.  **Authentication**: Listens for Firebase auth state changes (`onAuthStateChanged`).
 * 2.  **Lean Profile Management**: On login, it attaches a real-time listener (`onSnapshot`)
 *     to the user's main profile document in Firestore (`users/{uid}`). It does NOT
 *     load heavy sub-collections like quiz history here, which is critical for performance.
 * 3.  **Connectivity**: It provides a reliable `isOffline` flag for the entire app.
 * 4.  **Automatic Profile Creation**: If a user signs in for the first time, it
 *     automatically creates their profile document in Firestore.
 */

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean; // True only while waiting for auth and the initial, lean profile
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
  
  // Listen for changes in the user's authentication state.
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        setLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // When a user logs in, set up a real-time listener for their core profile document.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const setupListener = async () => {
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) {
            setLoading(false);
            return;
        }

        const db = getFirebaseFirestore();
        if (!db) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data?.dob instanceof Timestamp) {
                    data.dob = data.dob.toDate().toISOString().split('T')[0];
                }
                setProfile(data);
            } else {
                await createUserDocument(user);
            }
            setLoading(false);
        }, (error) => {
            console.error("Profile snapshot error:", error);
            setIsOffline(true);
            setLoading(false);
        });

        return unsubProfile;
    };

    const unsub = setupListener();

    return () => {
        unsub.then(u => u && u());
    };
  }, [user]);

  // Function to update the user's profile data in Firestore.
  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const db = getFirebaseFirestore();
    if (!db) throw new Error("Firestore not available.");
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  // Function to add a quiz attempt and update player stats atomically.
  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    const db = getFirebaseFirestore();
    if (!db) throw new Error("Firestore not available.");
    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const currentProfile = profile || {};
    const newStats = {
      quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    await updateUserData(newStats);
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);

  const isProfileComplete = !!profile?.profileCompleted;

  const value = useMemo(() => ({
    user, profile, loading, isOffline, 
    updateUserData, addQuizAttempt, lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
