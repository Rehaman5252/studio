
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot, runTransaction, arrayUnion, Timestamp, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';
import { getQuizSlotId } from '@/lib/utils';

interface UserProfile {
  uid: string;
  name: string;
  photoURL?: string;
  currentStreak: number;
  lastStreakTimestamp?: Timestamp;
  referredBy?: string;
  noBallCount: number;
  lastNoBallTimestamp?: Timestamp;
  [key: string]: any;
}

interface UserDataContextType {
  user: User | null;
  profile: UserProfile | null; 
  isProfileComplete: boolean;
  loading: boolean;
  lastAttemptInSlot: QuizAttempt | null;
  quizHistory: {
    data: QuizAttempt[];
    loading: boolean;
    error: string | null;
  },
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  isOffline: boolean;
}

const AuthContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: firebaseLoading } = useFirebase();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [quizHistory, setQuizHistory] = useState<{data: QuizAttempt[], loading: boolean, error: string | null}>({ data: [], loading: true, error: null });

  useEffect(() => {
    const setOfflineTrue = () => setIsOffline(true);
    const setOfflineFalse = () => setIsOffline(false);
    window.addEventListener('online', setOfflineFalse);
    window.addEventListener('offline', setOfflineTrue);
    if (typeof navigator.onLine === 'boolean') setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', setOfflineFalse);
      window.removeEventListener('offline', setOfflineTrue);
    };
  }, []);

  const handleUserDocument = useCallback(async (user: User, additionalData: Record<string, any> = {}) => {
    if (!db) {
        toast({ title: "Connection Error", description: "Database not available. You might be offline.", variant: "destructive" });
        throw new Error("Database not available");
    }
    const userRef = doc(db, 'users', user.uid);
    let referredBy = '';
    
    if (additionalData.referralCode) {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('referralCode', '==', additionalData.referralCode), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            referredBy = querySnapshot.docs[0].id;
        } else {
            console.warn(`Referral code "${additionalData.referralCode}" not found.`);
        }
    }

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
        referredBy: referredBy,
        referralBonusPaid: false,
        quizzesPlayed: 0,
        perfectScores: 0,
        totalRewards: 0,
        totalScore: 0,
        profileCompleted: false,
        guidedTourCompleted: false,
        phoneVerified: false,
        referralCode: `ref${user.uid.substring(0, 4)}`,
        referralEarnings: 0,
        noBallCount: 0,
        lastNoBallTimestamp: null,
        currentStreak: 0,
        lastStreakTimestamp: null,
      };
      await setDoc(userRef, sanitizeUserProfile(newUserProfile));
      
      if (referredBy) {
          const referrerRef = doc(db, 'users', referredBy);
          await updateDoc(referrerRef, {
              referrals: arrayUnion(user.uid)
          });
      }

      return newUserProfile;
    } else {
        const existingData = docSnap.data();
        const updates: Record<string, any> = {};
        if (user.photoURL && user.photoURL !== existingData.photoURL) {
            updates.photoURL = user.photoURL;
        }
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
        }
      return docSnap.data();
    }
  }, [toast]);
  
  useEffect(() => {
    if (firebaseLoading) {
        setProfileLoading(true);
        return;
    }
    
    if (!user) {
        setProfile(null);
        setProfileLoading(false);
        setLastAttemptInSlot(null);
        setQuizHistory({ data: [], loading: false, error: null });
        return;
    }

    if (!db) {
        console.error("Firestore (db) is not available, possibly due to SSR.");
        setProfileLoading(false);
        return;
    }

    setProfileLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        handleUserDocument(user).catch(console.error);
        setProfile(null);
      }
      setProfileLoading(false);
    }, (error) => {
        console.error("Error fetching profile with onSnapshot:", error);
        setProfile(null);
        setProfileLoading(false);
        setIsOffline(true);
    });

    const currentSlotId = getQuizSlotId();
    const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizAttempts'), currentSlotId);
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
    
    setQuizHistory(prev => ({ ...prev, loading: true }));
    const historyQuery = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"));
    const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
        const historyData = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
        setQuizHistory({ data: historyData, loading: false, error: null });
    }, (error) => {
        console.error("Error fetching quiz history:", error);
        setQuizHistory({ data: [], loading: false, error: error.message });
        setIsOffline(true);
    });


    return () => {
        unsubscribeProfile();
        unsubscribeAttempt();
        unsubscribeHistory();
    };
  }, [user, firebaseLoading, handleUserDocument]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    if(!auth) return null;
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
    if(!auth) return null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        await updateProfile(user, { displayName: name });
        await handleUserDocument(user, { name, phone, referralCode });
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
    if(!auth) return null;
    try {
      const userCredential = await firebaseSignInWithEmail(auth, email, password);
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
    if(!auth) return;
    await signOut(auth);
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
  }, [toast]);

  const updateUserData = useCallback(async (newData: Partial<UserProfile>) => {
    if (!user || !db) return;
    const allowedFields = ['name', 'phone', 'photoURL', 'profileCompleted', 'guidedTourCompleted', 'dob', 'gender', 'occupation', 'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer', 'phoneVerified'];
    const filteredData: Partial<UserProfile> = Object.keys(newData).reduce((acc: any, key) => {
      if (allowedFields.includes(key)) acc[key] = (newData as any)[key];
      return acc;
    }, {});
    
    if (Object.keys(filteredData).length === 0) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { ...sanitizeUserProfile(filteredData), updatedAt: serverTimestamp() });
      setIsOffline(false);
    } catch (e) {
      console.error('updateUserData failed:', e);
      toast({ title: "Update Failed", description: "Your changes could not be saved. You might be offline.", variant: 'destructive' });
      setIsOffline(true);
      throw e;
    }
  }, [user, toast]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !profile || !db) return;
    
    const sanitizedAttempt = { ...attempt, score: attempt.score || 0, totalQuestions: attempt.totalQuestions || 0, reason: attempt.reason || null };

    try {
      await runTransaction(db, async transaction => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw new Error('User not found');
        
        const data = userDoc.data() as UserProfile;
        const statsUpdate: { [key:string]: any } = { 
            quizzesPlayed: increment(1),
            totalScore: increment(sanitizedAttempt.score),
            updatedAt: serverTimestamp(),
        };
        const isPerfectScore = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
        if (isPerfectScore) {
            statsUpdate.perfectScores = increment(1);
            statsUpdate.totalRewards = increment(100);
        }

        const todayUTC = new Date();
        todayUTC.setUTCHours(0, 0, 0, 0);
        const lastStreakTimestamp = data.lastStreakTimestamp ? (data.lastStreakTimestamp as Timestamp).toDate() : null;
        
        if (lastStreakTimestamp) {
            const lastStreakUTC = new Date(lastStreakTimestamp.getTime());
            lastStreakUTC.setUTCHours(0, 0, 0, 0);
            const isSameDay = todayUTC.getTime() === lastStreakUTC.getTime();

            if (!isSameDay) {
                const yesterdayUTC = new Date(todayUTC.getTime() - 86400000);
                const isYesterday = lastStreakUTC.getTime() === yesterdayUTC.getTime();
                statsUpdate.currentStreak = isYesterday ? increment(1) : 1;
                statsUpdate.lastStreakTimestamp = serverTimestamp();
            }
        } else {
            // First time playing
            statsUpdate.currentStreak = 1;
            statsUpdate.lastStreakTimestamp = serverTimestamp();
        }

        transaction.update(userDocRef, statsUpdate);
        
        const attemptRef = doc(db, 'users', user.uid, 'quizAttempts', sanitizedAttempt.slotId);
        transaction.set(attemptRef, sanitizeUserProfile(sanitizedAttempt));

        const liveEntryRef = doc(db, 'leaderboard_live', sanitizedAttempt.slotId, 'entries', user.uid);
        const totalTime = sanitizedAttempt.timePerQuestion ? sanitizedAttempt.timePerQuestion.reduce((a, b) => a + b, 0) : 0;
        transaction.set(liveEntryRef, {
            userId: user.uid,
            name: profile.name,
            avatar: profile.photoURL,
            score: sanitizedAttempt.score,
            time: totalTime,
            disqualified: !!sanitizedAttempt.reason,
            totalQuestions: sanitizedAttempt.totalQuestions,
            format: sanitizedAttempt.format,
            slotId: sanitizedAttempt.slotId,
            source: sanitizedAttempt.source ?? null,
            updatedAt: serverTimestamp(),
        }, { merge: true });
      });
      setIsOffline(false);
    } catch (e) {
      console.error('addQuizAttempt failed:', e);
      toast({ title: "Sync Error", description: "Could not save your quiz result.", variant: 'destructive' });
      setIsOffline(true);
    }
  }, [user, profile, toast]);

  const handleMalpractice = useCallback(async (): Promise<number> => {
    if (!user || !profile || !db) return 0;
    
    let newNoBallCount = profile.noBallCount || 0;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp.toMillis()) : null;
      if (lastNoBallDay) lastNoBallDay.setHours(0,0,0,0);
      
      if (!lastNoBallDay || lastNoBallDay.getTime() !== today.getTime()) {
        newNoBallCount = 1;
      } else {
        newNoBallCount++;
      }

      await updateDoc(userDocRef, {
        noBallCount: newNoBallCount,
        lastNoBallTimestamp: serverTimestamp(),
      });
      setIsOffline(false);
      return newNoBallCount;
    } catch (e) {
      console.error('handleMalpractice failed:', e);
      setIsOffline(true);
      return newNoBallCount;
    }
  }, [user, profile]);

  const value: UserDataContextType = { 
    user,
    loading: firebaseLoading || profileLoading,
    profile, 
    isProfileComplete: profile?.profileCompleted || false,
    quizHistory,
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a UserDataProvider");
  }
  return context;
}
