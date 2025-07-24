
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, writeBatch, onSnapshot, runTransaction } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';
import { getQuizSlotId } from '@/lib/utils';
import { collection } from 'firebase/firestore';
import type { LivePlayer } from '@/components/leaderboard/leaderboardTypes';

interface UserDataContextType {
  user: User | null; // This is the firebase auth user from the parent provider
  profile: any | null; 
  isProfileComplete: boolean;
  loading: boolean; // This now represents profile loading status
  lastAttemptInSlot: QuizAttempt | null;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  isOffline: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, loading: firebaseLoading } = useFirebase();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator.onLine === 'boolean') {
      setIsOffline(!navigator.onLine);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUserDocument = useCallback(async (user: User, additionalData: Record<string, any> = {}) => {
    if (!db) {
        toast({ title: "Connection Error", description: "Database not available. You might be offline.", variant: "destructive" });
        throw new Error("Database not available");
    }
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const name = additionalData.name || user.displayName || 'New User';
      const newUserProfile = {
        uid: user.uid,
        name: name,
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
        guidedTourCompleted: false,
        phoneVerified: false,
        referralCode: `CricBlitz.com/ref/${name.split(' ')[0]}${user.uid.substring(0, 4)}`.toLowerCase(),
        referralEarnings: 0,
        noBallCount: 0,
        lastNoBallTimestamp: null,
      };
      await setDoc(userRef, sanitizeUserProfile(newUserProfile));
      return newUserProfile;
    } else {
        // If user logs in with Google and doc exists, ensure their photoURL is updated from Google.
        if (user.photoURL && user.photoURL !== docSnap.data().photoURL) {
            await updateDoc(userRef, { photoURL: user.photoURL });
        }
      return docSnap.data();
    }
  }, [toast]);
  
  useEffect(() => {
    if (firebaseLoading) {
        setProfileLoading(true);
        return;
    }
    
    if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        setLastAttemptInSlot(null);
        return;
    }

    if (!db) {
        console.error("Firestore (db) is not available, possibly due to SSR.");
        setProfileLoading(false);
        return;
    }

    setProfileLoading(true);
    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
            ...data,
            phoneVerified: data.phoneVerified || false // Ensure phoneVerified is always a boolean
        });
      } else {
        // This case can happen for a brief moment when a new user signs up.
        // handleUserDocument will create it, and the next snapshot will catch it.
        handleUserDocument(firebaseUser);
        setProfile(null);
      }
      setProfileLoading(false);
      setIsOffline(false);
    }, (error) => {
        console.error("Error fetching profile with onSnapshot:", error);
        if (error.code === 'unavailable') {
            setIsOffline(true);
        }
        setProfile(null);
        setProfileLoading(false);
    });

    const currentSlotId = getQuizSlotId();
    const attemptDocRef = doc(db, 'users', firebaseUser.uid, 'quizAttempts', currentSlotId);
    const unsubscribeAttempt = onSnapshot(attemptDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setLastAttemptInSlot(docSnap.data() as QuizAttempt);
        } else {
            setLastAttemptInSlot(null);
        }
    }, (error) => {
        console.warn("Could not listen to slot attempt:", error.message);
        setLastAttemptInSlot(null);
    });

    return () => {
        unsubscribeProfile();
        unsubscribeAttempt();
    };
  }, [firebaseUser, firebaseLoading, handleUserDocument]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await handleUserDocument(result.user);
        toast({ title: "Signed In", description: "Welcome back!" });
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
    try {
      const userCredential = await firebaseSignInWithEmail(auth, email, password);
      // We don't need to call handleUserDocument here as the useEffect will fetch the existing profile.
      toast({ title: "Signed In", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any)
    {
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
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
  }, [toast]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!firebaseUser || !db) throw new Error("User not authenticated or DB not available.");
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
        const dataToUpdate = sanitizeUserProfile({...newData, updatedAt: serverTimestamp()});
        await updateDoc(userDocRef, dataToUpdate);
    } catch (error) {
        console.error("Update user data failed:", error);
        toast({ title: "Update Failed", description: "Your changes could not be saved. You might be offline.", variant: 'destructive' });
        throw error;
    }
  }, [firebaseUser, toast]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!firebaseUser || !profile || !db) throw new Error("User not authenticated, profile not loaded, or DB not available.");

    const userRef = doc(db, 'users', firebaseUser.uid);
    const attemptRef = doc(db, 'users', firebaseUser.uid, 'quizAttempts', attempt.slotId);

    try {
        await runTransaction(db, async (transaction) => {
            // Prepare personal user stats update
            const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
            const statsUpdate: {[key:string]: any} = { quizzesPlayed: increment(1) };
            if (isPerfect) {
                statsUpdate.perfectScores = increment(1);
                statsUpdate.totalRewards = increment(100);
            }
            
            // Execute all writes in the transaction
            transaction.set(attemptRef, sanitizeUserProfile(attempt)); // Set personal quiz history
            transaction.update(userRef, statsUpdate); // Update user's aggregate stats
        });

        // Update local state after successful transaction
        setLastAttemptInSlot(attempt);

    } catch (error) {
        console.error("Add quiz attempt transaction failed:", error);
        toast({
            title: "Sync Error",
            description: "Could not save your quiz result. Please check your connection.",
            variant: 'destructive',
        });
        // If the transaction fails, we might need to fall back to a simpler write
        // for personal history to not lose the data entirely.
        try {
            await setDoc(attemptRef, sanitizeUserProfile(attempt));
        } catch (fallbackError) {
            console.error("Fallback attempt save also failed:", fallbackError);
        }
    }
  }, [firebaseUser, profile, toast]);
  
  const handleMalpractice = useCallback(async (): Promise<number> => {
    if (!firebaseUser || !profile || !db) return 0;
    
    const userRef = doc(db, 'users', firebaseUser.uid);
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
    
    // We can't use updateUserData here because it would cause an infinite loop
    // as updateUserData depends on this context. Direct update is necessary.
    const sanitizedData = sanitizeUserProfile(updatedProfileData);
    await updateDoc(userRef, sanitizedData);
    
    // Manually update local profile state to reflect change immediately
    setProfile((prev: any) => ({ ...prev, ...updatedProfileData }));

    return newNoBallCount;
  }, [firebaseUser, profile, db]);

  const value = { 
    user: firebaseUser,
    loading: firebaseLoading || profileLoading,
    profile, 
    isProfileComplete: profile?.profileCompleted || false,
    logout, 
    signInWithGoogle, 
    registerWithEmail, 
    loginWithEmail, 
    updateUserData, 
    addQuizAttempt, 
    handleMalpractice,
    lastAttemptInSlot,
    isOffline,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a UserDataProvider");
  }
  return context;
}
