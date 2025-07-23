'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import useFirebaseReady from '@/hooks/useFirebaseReady';

async function createUserDocument(user: User) {
  const db = getFirebaseFirestore();
  if (!db || !user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user;
    await setDoc(userRef, {
      uid: user.uid,
      name: displayName,
      email: email,
      photoURL: photoURL,
      createdAt: new Date(),
      profileCompleted: false,
      // Add other default fields here
    });
  }
}

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  lastAttempt: QuizAttempt | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const firebaseReady = useFirebaseReady();

  useEffect(() => {
    if (!firebaseReady) return;

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [firebaseReady]);

  useEffect(() => {
    if (!user) return;
    
    const db = getFirebaseFirestore();
    if (!db) return;

    const unsubProfile = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
      if (!docSnap.exists()) {
        await createUserDocument(user);
      } else {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      }
      setLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Google Sign In Error", error);
      toast({ title: "Sign In Failed", description: "Could not sign in with Google.", variant: "destructive" });
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setProfile(null);
    setLastAttempt(null);
  };

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

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
  }, [user]);

  const value = useMemo(() => ({
    user, profile, loading, signInWithGoogle, logout, addQuizAttempt, updateUserData, lastAttempt, setLastAttempt
  }), [user, profile, loading, lastAttempt]);

  if (loading || !firebaseReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
