
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

async function createUserDocument(user: User, additionalData = {}) {
  if (!user || !firestore) return;
  
  const userDocRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const newUserProfile = {
      uid: user.uid,
      email,
      name: (additionalData as any).name || displayName || 'New User',
      photoURL: photoURL || `https://placehold.co/100x100.png`,
      createdAt: new Date(),
      emailVerified: user.emailVerified,
      quizzesPlayed: 0,
      perfectScores: 0,
      totalRewards: 0,
      profileCompleted: false,
      phoneVerified: false,
      referralCode: `CricBlitz.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
      referralEarnings: 0,
      ...additionalData
    };
    try {
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  }
}

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase is not configured. Auth features will be disabled.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false); // Auth state resolved, no user
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return; // No user to fetch profile for, stop loading.
    }
    
    // We have a user, now we listen for their profile.
    // The loading state will be set to false inside this listener.
    const userDocRef = doc(firestore, "users", user.uid);
    const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        // If profile doesn't exist, create it.
        try {
          await createUserDocument(user);
        } catch(e) {
          console.error("Failed to create user document on the fly", e);
        }
      }
      setLoading(false); // Profile loaded or created, stop loading.
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setIsOffline(true);
      setLoading(false); // Error occurred, stop loading.
    });
    
    return () => unsubProfile();
  }, [user]);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle the rest
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.warn('Google sign-in was cancelled by the user.');
            toast({ title: 'Sign-in Cancelled', description: 'The sign-in process was cancelled.', variant: 'default' });
        } else {
            console.error("Google Sign-In Error:", error);
            toast({ title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.', variant: 'destructive' });
        }
    }
  }, [toast]);
  
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
    const statsUpdate: {[key:string]: any} = { quizzesPlayed: increment(1) };
    if (isPerfect) {
        statsUpdate.perfectScores = increment(1);
        statsUpdate.totalRewards = increment(100);
    }
    batch.update(userRef, statsUpdate);
    await batch.commit();
  }, [user]);

  const isProfileComplete = !!profile?.profileCompleted;

  const value = useMemo(() => ({
    user, profile, loading, isOffline, signIn, logout, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, signIn, logout, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

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
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
