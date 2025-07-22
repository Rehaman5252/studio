
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, updateDoc, increment, arrayUnion, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { differenceInCalendarDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const quizFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const STREAK_QUIZ_TOTAL = 15;
const STREAK_FORMAT_MIN = 2;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (!auth) { 
        setLoading(false);
        return;
    }
    
    // ✅ Instant hydration from localStorage
    try {
        const cachedUser = localStorage.getItem('userCache');
        if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            // We can also set a temporary profile from cache to reduce flicker
            setProfile(parsedUser); 
        }
    } catch (e) {
        console.error("Failed to parse user cache", e);
        localStorage.removeItem('userCache');
    }
    
    // ✅ Real auth sync (non-blocking)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Update cache with the latest user data from Firebase Auth
        localStorage.setItem('userCache', JSON.stringify({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
        }));
      } else {
        localStorage.removeItem('userCache');
        setProfile(null);
      }
      setLoading(false); // Stop loading once the live auth state is confirmed
    });

    return () => unsubscribe();
  }, []);
  
  // Separate effect to sync Firestore profile data once user is known
  useEffect(() => {
    if (!user) {
        setProfile(null);
        return;
    }
    
    if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        return;
    }

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOffline(!online);
    
    const userDocRef = doc(db, "users", user.uid);
    const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.dob instanceof Timestamp) {
                data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
            setProfile(data);
            setIsProfileComplete(!!data.profileCompleted);
        } else {
            // This might happen on first login if the doc creation is slow
            console.log("User doc not found, it might be under creation...");
        }
    }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
    });

    return () => unsubProfile();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);


  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db || !profile) throw new Error("User not authenticated or DB not available.");

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);
    batch.set(attemptRef, sanitizedAttempt, { merge: true });

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    const newQuizzesPlayed = (profile.quizzesPlayed || 0) + 1;
    let newPerfectScores = profile.perfectScores || 0;
    let newTotalRewards = profile.totalRewards || 0;

    if (isPerfect) {
        newPerfectScores++;
        newTotalRewards += 100;
        const wasFirstPerfectScore = newPerfectScores === 1;

        if (wasFirstPerfectScore && profile.referredBy) {
          const joinDate = profile.createdAt.toDate();
          const scoreDate = new Date();
          const daysSinceJoined = differenceInCalendarDays(scoreDate, joinDate);
          const rewardedReferrals = profile.rewardedReferrals || [];
          if (daysSinceJoined <= 7 && !rewardedReferrals.includes(user.uid)) {
            const referrerRef = doc(db, "users", profile.referredBy);
            batch.update(referrerRef, {
              referralEarnings: increment(50),
              rewardedReferrals: arrayUnion(user.uid)
            });
          }
        }
    }
    
    batch.update(userRef, {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards,
    });
    

    const today = new Date();
    const lastStreakDate = profile.lastStreakTimestamp?.toDate();
    const streakDiff = lastStreakDate ? differenceInCalendarDays(today, lastStreakDate) : 0;
    
    let currentStreak = profile.currentStreak || 0;
    let dailyProgress = profile.dailyQuizProgress || {};

    if (streakDiff > 1) {
      currentStreak = 0;
      dailyProgress = {};
    } else if (streakDiff === 1) {
      dailyProgress = {};
    }

    dailyProgress[attempt.format] = (dailyProgress[attempt.format] || 0) + 1;
    dailyProgress.total = (dailyProgress.total || 0) + 1;

    const formatsMet = quizFormats.every(f => (dailyProgress[f] || 0) >= STREAK_FORMAT_MIN);
    
    if (dailyProgress.total >= STREAK_QUIZ_TOTAL && formatsMet) {
      if (streakDiff <= 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      batch.update(userRef, {
        currentStreak: currentStreak,
        lastStreakTimestamp: Timestamp.fromDate(today),
      });
      dailyProgress.goalAchieved = true; 
    }
    
    if (!dailyProgress.goalAchieved) {
      batch.update(userRef, { dailyQuizProgress: dailyProgress });
    }

    await batch.commit();

  }, [user, profile]);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        localStorage.removeItem('userCache');
        setUser(null);
        setProfile(null);
        toast({
            title: "Signed Out",
            description: "You have been logged out successfully.",
        });
    } catch (error) {
        toast({
            title: "Logout Failed",
            description: "Could not log you out. Please try again.",
            variant: "destructive",
        });
    }
  }, [toast]);
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, logout
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
