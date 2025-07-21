
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { Loader2 } from 'lucide-react';

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
    let authUnsubscribe: () => void = () => {};

    if (typeof window !== 'undefined') {
        const auth = getFirebaseAuth();
        authUnsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (!user) {
                setProfile(null);
                setLoading(false);
            }
        });
    } else {
        setLoading(false);
    }

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    setLoading(true);
    let profileUnsubscribe: () => void = () => {};

    const db = getFirebaseFirestore();
    const userDocRef = doc(db, "users", user.uid);
    
    // Check for doc existence first to create it if necessary
    getDoc(userDocRef).then((docSnap) => {
        if (!docSnap.exists()) {
            createUserDocument(user, db).then(() => {
                // After creating, now we can listen for snapshots
                listenToProfile();
            });
        } else {
            // If it exists, start listening immediately
            listenToProfile();
        }
    });

    const listenToProfile = () => {
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data?.dob instanceof Timestamp) {
                    data.dob = data.dob.toDate().toISOString().split('T')[0];
                }
                setProfile(data);
                setIsProfileComplete(!!data.profileCompleted);
            }
            setLoading(false);
        }, (error) => {
            console.error("Profile snapshot error:", error);
            setIsOffline(true);
            setLoading(false);
        });
    };

    return () => profileUnsubscribe();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user) throw new Error("User not authenticated.");
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user) throw new Error("User not authenticated.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
