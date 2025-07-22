
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

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

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

const isYesterday = (d1: Date, d2: Date) => {
    const yesterday = new Date(d2);
    yesterday.setDate(d2.getDate() - 1);
    return isSameDay(d1, yesterday);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
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
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
      }
      
      const online = await isFirebaseOnline();
      setIsOffline(!online);
      if (!online && !navigator.onLine) {
        setLoading(false);
      }

      const userDocRef = doc(db, "users", user.uid);
      
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          // Streak reset logic
          if (data?.lastStreakTimestamp) {
              const lastStreakDate = data.lastStreakTimestamp.toDate();
              const today = new Date();
              if (!isSameDay(lastStreakDate, today) && !isYesterday(lastStreakDate, today)) {
                  // Not today or yesterday, so streak is broken
                  if (data.currentStreak > 0) {
                      updateDoc(userDocRef, { currentStreak: 0 });
                      data.currentStreak = 0;
                  }
              }
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
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    setProfile(prev => {
        const updated = { ...(prev || {}), ...newData };
        setIsProfileComplete(!!updated.profileCompleted);
        return updated;
    });
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db || !profile) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    // --- STREAK LOGIC ---
    let dailyProgress = profile.dailyQuizProgress || {};
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset daily progress if it's a new day
    if (dailyProgress.date !== todayStr) {
        dailyProgress = {
            date: todayStr,
            formats: { T20: 0, IPL: 0, WPL: 0, ODI: 0, Test: 0, Mixed: 0 },
            totalPlayed: 0
        };
    }
    
    // Update progress for this attempt
    dailyProgress.totalPlayed += 1;
    if (dailyProgress.formats.hasOwnProperty(attempt.format)) {
        dailyProgress.formats[attempt.format] += 1;
    }

    let streakUpdated = false;
    let newStreak = profile.currentStreak || 0;
    
    // Check if streak condition is met
    const formatsPlayed = Object.values(dailyProgress.formats).filter(count => (count as number) >= 2).length;
    if (dailyProgress.totalPlayed >= 15 && formatsPlayed === 6) {
        // Condition met. Check if we already updated streak today.
        const lastStreakDate = profile.lastStreakTimestamp ? profile.lastStreakTimestamp.toDate() : null;
        if (!lastStreakDate || !isSameDay(lastStreakDate, new Date())) {
            newStreak += 1;
            streakUpdated = true;
        }
    }
    
    // --- STATS & REFERRAL LOGIC ---
    if (updateUserData) {
        const newStats: Partial<any> = {
          quizzesPlayed: (profile.quizzesPlayed || 0) + 1,
          perfectScores: (profile.perfectScores || 0) + (isPerfect ? 1 : 0),
          totalRewards: (profile.totalRewards || 0) + (isPerfect ? 100 : 0),
          dailyQuizProgress: dailyProgress,
        };

        if (streakUpdated) {
          newStats.currentStreak = newStreak;
          newStats.lastStreakTimestamp = new Date();
        }

        await updateUserData(newStats);

        // Handle referral bonus
        if (isPerfect && profile.referredBy) {
            const referrerRef = doc(db, "users", profile.referredBy);
            await updateDoc(referrerRef, {
                referralEarnings: increment(50)
            }).catch(e => console.error("Failed to update referrer earnings:", e));
        }
    }
    
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);
  
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
