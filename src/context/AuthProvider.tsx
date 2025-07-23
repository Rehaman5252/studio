
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

async function createUserDocument(user: User, additionalData: Record<string, any> = {}) {
  if (!user || !firestore) return;
  
  const userDocRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const newUserProfile = {
      uid: user.uid,
      email,
      name: additionalData.name || displayName || 'New User',
      photoURL: photoURL || `https://placehold.co/100x100.png`,
      phone: additionalData.phone || '',
      referredBy: additionalData.referralCode || '',
      createdAt: new Date(),
      emailVerified: user.emailVerified,
      quizzesPlayed: 0,
      perfectScores: 0,
      totalRewards: 0,
      profileCompleted: false,
      phoneVerified: false,
      referralCode: `CricBlitz.com/ref/${(additionalData.name || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
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
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
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
  const [loading, setLoading] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase is not configured. Auth features will be disabled.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // This is the key fix: The app is "ready" as soon as we know if a user is logged in or not.
      setLoading(false); 
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
        } else {
          // This case is for when a user exists in Auth but not Firestore.
          // We can create their document here.
          createUserDocument(user).then(() => {
              // The snapshot listener will pick up the new profile automatically.
          });
        }
      }, (error) => {
        console.error("Profile snapshot error:", error);
        setProfile(null);
      });
    } else {
      // If there's no user, there's no profile to listen to.
      setProfile(null);
    }
    
    // Cleanup the profile listener when the user changes or component unmounts.
    return () => unsubscribeProfile();
  }, [user]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await createUserDocument(result.user);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
             toast({ title: 'Sign-in cancelled', description: 'You closed the sign-in window.' });
        } else {
            console.error("Google Sign-In Error:", error);
            toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
        }
        return null;
    }
  }, [toast]);
  
  const registerWithEmail = useCallback(async (name: string, email: string, phone: string, password: string, referralCode?: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await createUserDocument(userCredential.user, { name, phone, referralCode });
        await sendEmailVerification(userCredential.user);
        return userCredential.user;
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
      } else if (error.code === 'auth/network-request-failed') {
          description = 'You appear to be offline. Please check your connection.';
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

  const value = {
    user, profile, loading, signInWithGoogle, registerWithEmail, loginWithEmail, logout, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
