
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase is not configured. Auth features will be disabled.");
      setLoading(false);
      return () => {};
    }

    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // If unsubscribeProfile is active, call it to clean up old listener
      unsubscribeProfile();

      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamps to serializable format
            if (data?.dob instanceof Timestamp) {
                data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
            // Sync email verification status from auth to firestore profile
            if (firebaseUser.emailVerified !== data.emailVerified) {
                await setDoc(userDocRef, { emailVerified: firebaseUser.emailVerified }, { merge: true });
                data.emailVerified = firebaseUser.emailVerified;
            }
            setProfile(data);
          } else {
            // Create user document if it doesn't exist (e.g., first-time Google sign-in)
            const newUserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
              emailVerified: firebaseUser.emailVerified,
            };
            await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
            setProfile(newUserProfile);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Cleanup both auth and profile listeners on unmount
    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener will handle document creation
        return result.user;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error:", error);
            toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
        }
        return null;
    }
  }, [toast]);
  
  const registerWithEmail = useCallback(async (name: string, email: string, phone: string, password: string, referralCode?: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        await updateProfile(user, { displayName: name });
        
        // Create the user document in Firestore immediately after auth creation
        const userDocRef = doc(firestore, 'users', user.uid);
        const newUserProfile = {
          uid: user.uid,
          email, name, phone,
          photoURL: `https://placehold.co/100x100.png`,
          referredBy: referralCode || '',
          createdAt: serverTimestamp(),
          emailVerified: user.emailVerified,
          quizzesPlayed: 0,
          perfectScores: 0,
          totalRewards: 0,
          profileCompleted: false,
          phoneVerified: false,
          referralCode: `CricBlitz.com/ref/${name.split(' ')[0]}${user.uid.substring(0, 4)}`,
          referralEarnings: 0,
        };
        await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));

        await sendEmailVerification(user);
        return user;
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please use at least 8 characters.';
        }
        console.error("Registration Error: ", error);
        toast({ title: 'Sign Up Failed', description, variant: 'destructive' });
        return null;
    }
  }, [toast]);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await firebaseSignInWithEmail(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = 'Invalid credentials. Please check your email and password.';
      }
      toast({ title: 'Login Failed', description, variant: 'destructive' });
      return null;
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
    if (!user) throw new Error("User not authenticated.");
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    
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

  const value = {
    user, profile, loading, signInWithGoogle, registerWithEmail, loginWithEmail, logout, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  };

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
