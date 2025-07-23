
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, onSnapshot, setDoc, increment, Timestamp, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean; // This will now represent only the initial auth check
  isOffline: boolean;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  handleMalpractice: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true); // Represents initial auth state check
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const createUserDocument = useCallback(async (user: User, additionalData: Record<string, any> = {}) => {
    if (!firestore) return;
    
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile = {
          uid: user.uid,
          name: additionalData.name || user.displayName,
          email: user.email,
          phone: additionalData.phone || '',
          photoURL: user.photoURL || `https://placehold.co/100x100.png`,
          createdAt: serverTimestamp(),
          emailVerified: user.emailVerified,
          referredBy: additionalData.referredBy || '',
          quizzesPlayed: 0,
          perfectScores: 0,
          totalRewards: 0,
          profileCompleted: false,
          phoneVerified: false,
          referralCode: `CricBlitz.com/ref/${(additionalData.name || user.displayName || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
          referralEarnings: 0,
          noBallCount: 0,
          lastNoBallTimestamp: null,
      };
      await setDoc(userRef, sanitizeUserProfile(newUserProfile));
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase is not configured. Auth features will be disabled.");
      setLoading(false);
      return () => {};
    }

    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile(); // Clean up old listener

      if (firebaseUser) {
        setUser(firebaseUser);
        if (!firestore) {
            setLoading(false);
            return;
        }
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          setIsOffline(docSnap.metadata.fromCache);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.dob instanceof Timestamp) {
                data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
             if (data?.lastNoBallTimestamp instanceof Timestamp) {
                data.lastNoBallTimestamp = data.lastNoBallTimestamp.toMillis();
            }
            if (firebaseUser.emailVerified !== data.emailVerified) {
                await setDoc(userDocRef, { emailVerified: firebaseUser.emailVerified }, { merge: true });
                data.emailVerified = firebaseUser.emailVerified;
            }
            setProfile(data);
          } else {
            await createUserDocument(firebaseUser);
          }
          setLoading(false);
        }, (error) => {
            console.error("Firestore Snapshot Error:", error);
            if (error.code === 'unavailable') {
                setIsOffline(true);
            }
            setProfile(null); // Clear profile on error
            setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        setIsOffline(false);
      }
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, [createUserDocument]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await createUserDocument(result.user, {name: result.user.displayName});
        return result.user;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error:", error);
            toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
        }
        return null;
    }
  }, [toast, createUserDocument]);
  
  const registerWithEmail = useCallback(async (name: string, email: string, phone: string, password: string, referralCode?: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        await updateProfile(user, { displayName: name });
        await createUserDocument(user, { name, phone, referredBy: referralCode });
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
  }, [toast, createUserDocument]);

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
    if (!firestore) return;
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    if (!firestore) return;
    
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

  const handleMalpractice = useCallback(async (): Promise<number> => {
    if (!user || !profile) return 0;
    if (!firestore) return 0;

    const userRef = doc(firestore, 'users', user.uid);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp).setHours(0, 0, 0, 0) : null;
    
    let newNoBallCount = profile.noBallCount || 0;

    if (lastNoBallDay !== today) {
      newNoBallCount = 1;
    } else {
      newNoBallCount++;
    }

    await setDoc(userRef, {
        noBallCount: newNoBallCount,
        lastNoBallTimestamp: serverTimestamp()
    }, { merge: true });
    
    setProfile(p => (p ? {
        ...p,
        noBallCount: newNoBallCount,
        lastNoBallTimestamp: Date.now()
    } : null));

    return newNoBallCount;
  }, [user, profile]);

  const isProfileComplete = !!profile?.profileCompleted;

  const value = {
    user, profile, loading, isOffline, signInWithGoogle, registerWithEmail, loginWithEmail, logout, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, handleMalpractice
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
