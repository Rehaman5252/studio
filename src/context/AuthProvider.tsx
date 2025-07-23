'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { auth, firestore, signInWithGoogle, logout as firebaseLogout } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import useFirebaseReady from '@/hooks/useFirebaseReady';

async function createUserDocument(user: FirebaseUser) {
    if (!user?.uid) return;

    const userRef = doc(firestore, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { displayName, email, photoURL } = user;
      await setDoc(userRef, {
        uid: user.uid,
        name: displayName || 'New Player',
        email: email,
        photoURL: photoURL || `https://placehold.co/100x100.png`,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
        quizzesPlayed: 0,
        perfectScores: 0,
        totalRewards: 0,
        referralEarnings: 0,
        phoneVerified: false,
        referralCode: `https://cricblitz.com/auth/signup?ref=${user.uid.substring(0, 8)}`,
      });
    }
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Record<string, any> | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  lastAttempt: QuizAttempt | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const firebaseReady = useFirebaseReady();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!firebaseReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await createUserDocument(firebaseUser);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            setProfile(userDoc.data());
        }
      } else {
        setProfile(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const signIn = async () => {
    try {
        await signInWithGoogle();
    } catch(e) {
        toast({ title: "Sign-In Failed", description: "Could not sign in with Google.", variant: "destructive" });
    }
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
    setProfile(prev => ({...prev, ...newData}));
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

  }, [user, updateUserData]);

  if (!firebaseReady || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateUserData, addQuizAttempt, lastAttempt, setLastAttempt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
