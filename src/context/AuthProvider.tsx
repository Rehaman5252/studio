
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
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
  isUserDataLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) { 
      console.error("Firebase Auth is not available.");
      setLoading(false); 
      return; 
    }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { 
      setProfile(null); 
      setLoading(false); 
      return; 
    }
    
    let isMounted = true;
    setLoading(true);

    const fetchProfile = async () => {
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        if (isMounted) setLoading(false);
        return;
      }
      
      const online = await isFirebaseOnline();
      setIsOffline(!online);
      if (!online) {
        if (isMounted) setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (!isMounted) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
        } else {
          // If the document doesn't exist, create it.
          await createUserDocument(user);
          // After creation, re-fetch to ensure the context has the new profile data.
          const newDocSnap = await getDoc(userDocRef);
          if (isMounted && newDocSnap.exists()) {
             setProfile(newDocSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setIsOffline(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchProfile();
    
    return () => { isMounted = false; }
  }, [user]);

  const updateUserData = useCallback(async (data: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    setProfile(prev => prev ? ({ ...prev, ...data }) : data);
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(data), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const currentProfile = profile || {};
    const newStats = {
      quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
    if (updateUserData) {
      await updateUserData(newStats);
    }
  }, [user, profile, updateUserData]);

  const isProfileComplete = useMemo(() => {
    return !!profile?.profileCompleted;
  }, [profile]);
  
  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isOffline,
    updateUserData,
    addQuizAttempt,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    isUserDataLoading: loading,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
