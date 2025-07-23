
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null; // Keep profile here for convenience in other parts of the app
  isProfileComplete: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile when auth state changes
        try {
          if (!db) {
             throw new Error("Firestore not available");
          }
          const userRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null); // No profile exists yet
          }
        } catch (error: any) {
            console.error("Error fetching profile in AuthProvider:", error);
            if (error.message?.includes("offline")) {
                setIsOffline(true);
            }
            setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      setProfile(newUserProfile);
      return newUserProfile;
    } else {
      const profileData = docSnap.data();
      setProfile(profileData);
      return profileData;
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
    setProfile(null);
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
  }, [toast]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user || !db) throw new Error("User not authenticated or DB not available.");
    const userDocRef = doc(db, "users", user.uid);
    try {
        const dataToUpdate = sanitizeUserProfile({...newData, updatedAt: serverTimestamp()});
        await updateDoc(userDocRef, dataToUpdate);
        // Optimistically update local profile state
        setProfile((prevProfile: any) => ({ ...prevProfile, ...newData }));
    } catch (error) {
        console.error("Update user data failed:", error);
        toast({ title: "Update Failed", description: "Your changes could not be saved. You might be offline.", variant: 'destructive' });
        throw error;
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
    
    await updateUserData(updatedProfileData);
    return newNoBallCount;
  }, [user, profile, updateUserData]);

  const setLastAttempt = useCallback((attempt: QuizAttempt | null) => {
    // This is now just a placeholder if needed elsewhere, but QuizStatusProvider handles the real logic
  }, []);

  const value = { 
    user, 
    loading, 
    profile, 
    isProfileComplete: profile?.profileCompleted || false,
    logout, 
    signInWithGoogle, 
    registerWithEmail, 
    loginWithEmail, 
    updateUserData, 
    addQuizAttempt, 
    handleMalpractice,
    setLastAttempt,
    isOffline
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
