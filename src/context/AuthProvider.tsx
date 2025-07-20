
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
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
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    // Listen for Firebase Auth state changes.
    const auth = getFirebaseAuth();
    if (!auth) { 
        setLoading(false); 
        return; 
    }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // When user state changes, manage their profile data.
    if (!user) { 
        setProfile(null); 
        setLoading(false); 
        return; 
    }
    
    let unsubProfile: () => void = () => {};
    
    setLoading(true);

    const setupListeners = async () => {
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
      }
      
      const online = await isFirebaseOnline();
      setIsOffline(!online);
      if (!online) {
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      
      // Use onSnapshot for real-time profile updates.
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          // If profile doesn't exist, create it. This is a crucial fix for new users.
          await createUserDocument(user);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
        setLoading(false);
      });
      
    };
    
    setupListeners();
    
    return () => {
        unsubProfile();
    };
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    // Optimistic update: update local state immediately for a responsive UI.
    setProfile(prev => {
        const updated = { ...(prev || {}), ...newData };
        setIsProfileComplete(!!updated.profileCompleted);
        return updated;
    });
    
    const userDocRef = doc(db, "users", user.uid);
    // Write to Firestore in the background. Sanitize data to prevent errors.
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    // Update user stats after a quiz.
    if (updateUserData) {
        const currentProfile = profile || {};
        const newStats = {
          quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
          perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
          totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        await updateUserData(newStats);
    }
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily access the Auth context from any client component.
 */
export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
