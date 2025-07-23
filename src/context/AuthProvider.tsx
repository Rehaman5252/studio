
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { createUserDocument } from '@/lib/authUtils';
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        // This case handles if Firebase fails to initialize entirely.
        console.error("Firebase Auth is not available.");
        setLoading(false);
        setIsOffline(true);
        return;
    }
    
    // onAuthStateChanged returns the unsubscribe function.
    // It fires once on initial load (with user or null) and then on any auth change.
    // This is our signal that Firebase is ready.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Set loading to false *after* the first auth check.
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // If there's no user, clear profile data.
    if (!user) {
        setProfile(null);
        setIsProfileComplete(false);
        return;
    }

    const db = getFirebaseFirestore();
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
        try {
            await createUserDocument(user);
        } catch (e) {
            console.error("Failed to create user document on the fly", e);
            toast({
                title: "Account Setup Error",
                description: "Could not initialize your user profile. Please try refreshing.",
                variant: "destructive"
            });
        }
      }
    }, (error) => {
        console.error("Profile snapshot error:", error);
        if (error.code === 'unavailable') {
            setIsOffline(true);
        }
    });

    return () => unsubProfile();
  }, [user, toast]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db || !profile) throw new Error("User, DB, or profile not available.");
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, attempt.slotId);
    batch.set(attemptRef, sanitizeUserProfile(attempt));
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const statsUpdate: {[key: string]: any} = { quizzesPlayed: increment(1) };
    if (isPerfect) {
        statsUpdate.perfectScores = increment(1);
        statsUpdate.totalRewards = increment(100);
    }
    batch.update(userRef, statsUpdate);
    await batch.commit();
  }, [user, profile, updateUserData]);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
        await signOut(auth);
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

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
