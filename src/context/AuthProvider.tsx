
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword as firebaseSignInWithEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, writeBatch, onSnapshot, runTransaction, arrayUnion, Timestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';
import { getQuizSlotId } from '@/lib/utils';
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
    let referredBy = '';
    
    // If a referral code was provided, find the referrer's UID
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
        profileCompleted: false,
        guidedTourCompleted: false,
        phoneVerified: false,
        referralCode: `ref${user.uid.substring(0, 4)}`,
        referralEarnings: 0,
        noBallCount: 0,
        lastNoBallTimestamp: null,
        currentStreak: 0,
        lastStreakTimestamp: null,
        seenQuestionIds: [],
      };
      await setDoc(userRef, sanitizeUserProfile(newUserProfile));
      
      // If a referrer was found, update their list of referrals
      if (referredBy) {
          const referrerRef = doc(db, 'users', referredBy);
          await updateDoc(referrerRef, {
              referrals: arrayUnion(user.uid)
          });
      }

      return newUserProfile;
    } else {
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
            phoneVerified: data.phoneVerified || false
        });
      } else {
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
    const attemptDocRef = doc(collection(db, 'users', firebaseUser.uid, 'quizAttempts'), currentSlotId);
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
    const attemptRef = doc(collection(db, 'users', firebaseUser.uid, 'quizAttempts'), attempt.slotId);
    const leaderboardRef = doc(db, 'leaderboard', 'currentQuiz');
    const questionIds = attempt.questions.map(q => q.id);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User profile does not exist.");
            const userProfile = userDoc.data();

            const statsUpdate: {[key:string]: any} = { 
                quizzesPlayed: increment(1),
                seenQuestionIds: arrayUnion(...questionIds)
            };
            
            // Referral Bonus Logic
            const isPerfectScore = attempt.score === attempt.totalQuestions && !attempt.reason;
            if (isPerfectScore && userProfile.referredBy && !userProfile.referralBonusPaid) {
                const referrerRef = doc(db, 'users', userProfile.referredBy);
                transaction.update(referrerRef, { referralEarnings: increment(50) });
                statsUpdate.referralBonusPaid = true; // Mark as paid for the current user
            }

            // Daily Activity & Streak Logic
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const dailyActivityRef = doc(db, 'users', firebaseUser.uid, 'dailyActivity', todayStr);
            const dailyActivityDoc = await transaction.get(dailyActivityRef);
            
            let dailyData = dailyActivityDoc.exists() ? dailyActivityDoc.data() : { total: 0, T20: 0, ODI: 0, Test: 0, IPL: 0, WPL: 0, Mixed: 0 };
            dailyData.total = (dailyData.total || 0) + 1;
            dailyData[attempt.format] = (dailyData[attempt.format] || 0) + 1;

            const lastStreakDate = userProfile.lastStreakTimestamp ? (userProfile.lastStreakTimestamp as Timestamp).toDate() : null;
            const isSameDay = lastStreakDate ? today.toISOString().split('T')[0] === lastStreakDate.toISOString().split('T')[0] : false;

            if (!isSameDay) {
                const meetsStreakConditions =
                    dailyData.total >= 15 &&
                    dailyData.T20 >= 2 &&
                    dailyData.ODI >= 2 &&
                    dailyData.Test >= 2 &&
                    dailyData.IPL >= 2 &&
                    dailyData.WPL >= 2 &&
                    dailyData.Mixed >= 2;

                if (meetsStreakConditions) {
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    const isConsecutive = lastStreakDate ? yesterday.toISOString().split('T')[0] === lastStreakDate.toISOString().split('T')[0] : false;
                    
                    statsUpdate.currentStreak = isConsecutive ? increment(1) : 1;
                    statsUpdate.lastStreakTimestamp = serverTimestamp();
                } else if (lastStreakDate) {
                    const twoDaysAgo = new Date();
                    twoDaysAgo.setDate(today.getDate() - 2);
                    if (lastStreakDate < twoDaysAgo) {
                         statsUpdate.currentStreak = 0;
                    }
                }
            }
            
            transaction.set(dailyActivityRef, dailyData, { merge: true });

            const leaderboardDoc = await transaction.get(leaderboardRef);
            let leaderboardPlayers: LivePlayer[] = [];

            if (leaderboardDoc.exists() && leaderboardDoc.data().quizId === attempt.slotId) {
                leaderboardPlayers = leaderboardDoc.data().players || [];
            }
            
            leaderboardPlayers = leaderboardPlayers.filter(p => p.uid !== firebaseUser.uid);
            
            const totalTime = attempt.timePerQuestion ? attempt.timePerQuestion.reduce((a, b) => a + b, 0) : 0;
            const isDisqualified = !!attempt.reason;

            leaderboardPlayers.push({
                uid: firebaseUser.uid,
                name: profile.name,
                avatar: profile.photoURL,
                score: attempt.score,
                time: totalTime,
                disqualified: isDisqualified,
            });
            
            if (isPerfectScore) {
                statsUpdate.perfectScores = increment(1);
                statsUpdate.totalRewards = increment(100);
            }
            
            transaction.set(attemptRef, sanitizeUserProfile(attempt));
            transaction.update(userRef, statsUpdate);
            transaction.set(leaderboardRef, { 
                players: leaderboardPlayers, 
                lastUpdated: serverTimestamp(),
                quizId: attempt.slotId,
                status: 'in-progress',
            }, { merge: true });
        });

        setLastAttemptInSlot(attempt);

    } catch (error) {
        console.error("Add quiz attempt transaction failed:", error);
        toast({
            title: "Sync Error",
            description: "Could not save your quiz result. Please check your connection.",
            variant: 'destructive',
        });
        try {
            const statsUpdate: {[key:string]: any} = {
              quizzesPlayed: increment(1),
              seenQuestionIds: arrayUnion(...questionIds)
            };
             if (attempt.score === attempt.totalQuestions && !attempt.reason) {
                statsUpdate.perfectScores = increment(1);
                statsUpdate.totalRewards = increment(100);
            }
            await setDoc(attemptRef, sanitizeUserProfile(attempt));
            await updateDoc(userRef, statsUpdate);
            
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
    
    const sanitizedData = sanitizeUserProfile(updatedProfileData);
    await updateDoc(userRef, sanitizedData);
    
    setProfile((prev: any) => ({ ...prev, ...updatedProfileData }));

    return newNoBallCount;
  }, [firebaseUser, profile]);

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
