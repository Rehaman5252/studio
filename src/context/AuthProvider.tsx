
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // This will be deprecated in favor of component-level fetching
  profile: Record<string, any> | null; 
  isProfileComplete: boolean;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  setLastAttempt: (attempt: QuizAttempt) => void;
  isOffline: boolean; // Keep for offline UI banner
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null); // Legacy profile state
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.error("Firebase is not configured. Auth will not work.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserDocument = useCallback(async (user: User, additionalData: Record<string, any> = {}) => {
    if (!db) {
        setIsOffline(true);
        throw new Error("Database not available");
    }
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile = {
        uid: user.uid,
        name: additionalData.name || user.displayName || 'New User',
        email: user.email,
        phone: additionalData.phone || '',
        photoURL: user.photoURL || `https://placehold.co/100x100.png`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      return newUserProfile;
    } else {
      return docSnap.data();
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    if (!isFirebaseConfigured) return null;
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await handleUserDocument(result.user);
        return result.user;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error:", error);
            toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
        }
        return null;
    }
  }, [toast, handleUserDocument]);
  
  const registerWithEmail = useCallback(async (name: string, email: string, phone: string, password: string, referralCode?: string): Promise<User | null> => {
    if (!isFirebaseConfigured) return null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        await updateProfile(user, { displayName: name });
        await handleUserDocument(user, { name, phone, referredBy: referralCode });
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
  }, [toast, handleUserDocument]);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<User | null> => {
    if (!isFirebaseConfigured) return null;
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
    await signOut(auth);
    setProfile(null);
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
  }, [toast]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user || !db) throw new Error("User not authenticated or DB not available.");
    const userDocRef = doc(db, "users", user.uid);
    try {
        const dataToUpdate = sanitizeUserProfile({...newData, updatedAt: serverTimestamp()});
        await updateDoc(userDocRef, dataToUpdate);
        setProfile(prev => prev ? ({...prev, ...newData}) : newData); // Optimistic update
    } catch (error) {
        console.error("Update user data failed:", error);
        toast({ title: "Update Failed", description: "Your changes could not be saved. You might be offline.", variant: 'destructive' });
    }
  }, [user, toast]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db) throw new Error("User not authenticated or DB not available.");
    try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        const attemptRef = doc(collection(db, `users/${user.uid}/quizAttempts`), attempt.slotId);
        
        batch.set(attemptRef, sanitizeUserProfile(attempt));
        
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        const statsUpdate: {[key:string]: any} = { quizzesPlayed: increment(1) };
        if (isPerfect) {
            statsUpdate.perfectScores = increment(1);
            statsUpdate.totalRewards = increment(100);
        }
        
        batch.update(userRef, statsUpdate);
        
        await batch.commit();
    } catch (error) {
        console.error("Add quiz attempt failed:", error);
        toast({ title: "Sync Error", description: "Could not save your quiz attempt to the database.", variant: 'destructive' });
    }
  }, [user, toast]);

  const handleMalpractice = useCallback(async (): Promise<number> => {
    if (!user || !profile || !db) return 0;
    
    const userRef = doc(db, 'users', user.uid);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp.seconds * 1000).setHours(0, 0, 0, 0) : null;
    
    let newNoBallCount = profile.noBallCount || 0;

    if (lastNoBallDay !== today) {
      newNoBallCount = 1;
    } else {
      newNoBallCount++;
    }
    
    const updatedProfileData = {
        noBallCount: newNoBallCount,
        lastNoBallTimestamp: serverTimestamp()
    };
    
    await updateDoc(userRef, updatedProfileData);
    return newNoBallCount;
  }, [user, profile]);

  const isProfileComplete = !!profile?.profileCompleted;

  const value = {
    user, loading, profile, isProfileComplete, signInWithGoogle, registerWithEmail, loginWithEmail, logout, updateUserData, addQuizAttempt,
    handleMalpractice, isOffline, setLastAttempt: () => {}
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
