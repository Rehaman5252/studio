
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, arrayUnion, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { createUserDocument } from '@/lib/authUtils';
import { differenceInCalendarDays } from 'date-fns';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const quizFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const STREAK_QUIZ_TOTAL = 15;
const STREAK_FORMAT_MIN = 2;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (!auth) { 
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      // When auth state is resolved, we are no longer in the initial loading state.
      // Subsequent data loading is handled within the user effect.
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) {
        setProfile(null);
        return;
    }
    
    if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
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
            setIsProfileComplete(!!data.profileCompleted);
        } else {
            // If the document doesn't exist, it means we have a new user.
            // Let's create their profile document.
            try {
              await createUserDocument(user);
            } catch (error) {
              console.error("Failed to create user document:", error);
            }
        }
    }, (error) => {
        console.error("Profile snapshot error:", error);
        if(error.code === 'unavailable') setIsOffline(true);
    });

    return () => unsubProfile();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    const userDocRef = doc(db, "users", user.uid);
    await writeBatch(db).set(userDocRef, sanitizeUserProfile(newData), { merge: true }).commit();
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db || !profile) throw new Error("User, DB, or profile not available.");

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, attempt.slotId);
    
    batch.set(attemptRef, sanitizeUserProfile(attempt));

    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    if (isPerfect) {
        const wasFirstPerfectScore = (profile.perfectScores || 0) === 0;
        batch.update(userRef, { perfectScores: increment(1), totalRewards: increment(100) });

        if (wasFirstPerfectScore && profile.referredBy) {
            const joinDate = profile.createdAt?.toDate ? profile.createdAt.toDate() : new Date();
            const daysSinceJoined = differenceInCalendarDays(new Date(), joinDate);
            if (daysSinceJoined <= 7) {
                const referrerRef = doc(db, "users", profile.referredBy);
                batch.update(referrerRef, { referralEarnings: increment(50) });
            }
        }
    }
    
    batch.update(userRef, { quizzesPlayed: increment(1) });
    await batch.commit();

  }, [user, profile]);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        setLastAttempt(null);
        toast({
            title: "Signed Out",
            description: "You have been logged out successfully.",
        });
    } catch (error) {
        toast({
            title: "Logout Failed",
            description: "Could not log you out. Please try again.",
            variant: "destructive",
        });
    }
  }, [toast]);
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, logout
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
