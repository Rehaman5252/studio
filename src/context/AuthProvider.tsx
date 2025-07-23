
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';

interface UserDataContextType {
  user: User | null; // This is the firebase auth user from the parent provider
  profile: any | null; 
  isProfileComplete: boolean;
  loading: boolean; // This now represents profile loading status
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

  useEffect(() => {
    if (firebaseLoading) {
        setProfileLoading(true);
        return;
    }
    
    if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
    }

    if (!db) {
        console.error("Firestore (db) is not available, possibly due to SSR.");
        // We don't set offline here because it could just be a server render
        setProfileLoading(false);
        return;
    }

    setProfileLoading(true);
    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
      setIsOffline(false); // If we get data, we are online
    }, (error) => {
        console.error("Error fetching profile with onSnapshot:", error);
        if (error.code === 'unavailable') { // Explicitly check for offline error
            setIsOffline(true);
        }
        setProfile(null);
        setProfileLoading(false);
    });

    return () => unsubscribeProfile();
  }, [firebaseUser, firebaseLoading]);

  const handleUserDocument = useCallback(async (user: User, additionalData: Record<string, any> = {}) => {
    if (!db) {
        toast({ title: "Connection Error", description: "Database not available. You might be offline.", variant: "destructive" });
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
        guidedTourCompleted: false,
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
  }, [toast]);

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
      toast({ title: "Signed In", description: "Welcome back!" });
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
    if (!firebaseUser || !db) throw new Error("User not authenticated or DB not available.");
    try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const attemptRef = doc(collection(db, `users/${firebaseUser.uid}/quizAttempts`), attempt.slotId);
        
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
  }, [firebaseUser, toast]);
  
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
    
    await updateUserData(updatedProfileData);
    return newNoBallCount;
  }, [firebaseUser, profile, updateUserData]);

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
