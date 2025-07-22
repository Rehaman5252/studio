
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, updateDoc, increment, arrayUnion, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { differenceInCalendarDays } from 'date-fns';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const quizFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const STREAK_QUIZ_TOTAL = 15;
const STREAK_FORMAT_MIN = 2;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { 
        setProfile(null); 
        setLoading(false); 
        return; 
    }
    
    let unsubProfile: () => void = () => {};
    
    setLoading(true);

    const setupListeners = async () => {
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
      }
      
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOffline(!online);
      if (!online) {
        setLoading(false);
      }

      const userDocRef = doc(db, "users", user.uid);
      
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          await createUserDocument(user);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
        setLoading(false);
      });
    };
    
    setupListeners();
    
    return () => {
        unsubProfile();
    };
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
    const wasFirstPerfectScore = isPerfect && (profile.perfectScores || 0) === 0;
    
    batch.update(userRef, {
      quizzesPlayed: increment(1),
      perfectScores: increment(isPerfect ? 1 : 0),
      totalRewards: increment(isPerfect ? 100 : 0),
    });

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
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

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
