
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { createUserDocument } from '@/lib/authUtils';
import { Loader2 } from 'lucide-react';
import useFirebaseReady from '@/hooks/useFirebaseReady';

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
  const firebaseReady = useFirebaseReady();

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  useEffect(() => {
    if (!user || !firebaseReady) {
      if (!user) setLoading(false);
      return;
    }
    
    let unsubProfile: () => void = () => {};
    setLoading(true);

    const userDocRef = doc(firestore, "users", user.uid);
    unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        try {
          await createUserDocument(user);
        } catch(e) {
          console.error("Failed to create user document on the fly", e);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setIsOffline(true);
      setLoading(false);
    });
    
    return () => unsubProfile();
  }, [user, firebaseReady]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated or database not available.");
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated or DB not available.");
    const batch = writeBatch(firestore);
    const userRef = doc(firestore, 'users', user.uid);
    const attemptRef = doc(firestore, `users/${user.uid}/quizAttempts`, attempt.slotId);
    batch.set(attemptRef, sanitizeUserProfile(attempt));
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const statsUpdate: {[key: string]: any} = { quizzesPlayed: increment(1) };
    if (isPerfect) {
        statsUpdate.perfectScores = increment(1);
        statsUpdate.totalRewards = increment(100);
    }
    batch.update(userRef, statsUpdate);
    await batch.commit();
  }, [user]);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        setLastAttempt(null);
        toast({ title: "Signed Out", description: "You have been logged out successfully." });
    } catch (error) {
        toast({ title: "Logout Failed", description: "Could not log you out.", variant: "destructive" });
    }
  }, [toast]);
  
  const isProfileComplete = !!profile?.profileCompleted;

  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, logout
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, logout]);

  if (loading && firebaseReady) {
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
