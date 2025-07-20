
'use client';

import type { User } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';
import {
  doc,
  setDoc,
  Timestamp,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  quizHistory: QuizAttempt[];
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (newData: Partial<DocumentData>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  forceRefreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return !navigator.onLine;
    return false; // assume online during SSR
  });

  const forceRefreshData = useCallback(async () => {
    if (!user || isOffline) return;
    setLoading(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const historyDocRef = doc(db, 'quizHistory', user.uid);
        
        const [userDoc, historyDoc] = await Promise.all([
            getDoc(userDocRef),
            getDoc(historyDocRef)
        ]);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.dob && data.dob instanceof Timestamp) {
                data.dob = data.dob.toDate().toISOString().split('T')[0];
            }
            setProfile(data || null);
        }

        if (historyDoc.exists()) {
            const historyData = historyDoc.data().attempts || [];
            historyData.sort((a: QuizAttempt, b: QuizAttempt) => b.timestamp - a.timestamp);
            setQuizHistory(historyData);
        }

    } catch (error) {
        console.error("Failed to force refresh data:", error);
    } finally {
        setLoading(false);
    }
  }, [user, isOffline]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    if (user && !isOffline) {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const historyDocRef = doc(db, 'quizHistory', user.uid);

        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data?.dob && data.dob instanceof Timestamp) {
                    data.dob = data.dob.toDate().toISOString().split('T')[0];
                }
                setProfile(data || null);
            } else {
                await createUserDocument(user);
            }
        }, (error) => console.error("Profile snapshot error:", error));

        const unsubHistory = onSnapshot(historyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const historyData = docSnap.data().attempts || [];
                historyData.sort((a: QuizAttempt, b: QuizAttempt) => b.timestamp - a.timestamp);
                setQuizHistory(historyData);
            } else {
                setQuizHistory([]);
            }
        }, (error) => console.error("History snapshot error:", error));
        
        unsubs.push(unsubProfile, unsubHistory);

        // This is a simple way to determine when initial data has loaded
        Promise.all([getDoc(userDocRef), getDoc(historyDocRef)]).finally(() => setLoading(false));

    } else {
      setUser(null);
      setProfile(null);
      setQuizHistory([]);
      setLoading(false);
    }

    return () => unsubs.forEach(unsub => unsub());
  }, [user, isOffline]);


  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user || !db) {
      throw new Error("Could not save profile. Please check your connection and try again.");
    }
    const sanitizedData = sanitizeUserProfile(newData);
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("updateUserData error:", err);
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db) {
      throw new Error("User not authenticated or DB not available.");
    }
    
    // Optimistically update local state for immediate UI feedback
    setQuizHistory(prev => [attempt, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    
    try {
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        
        // Fetch latest profile to avoid race conditions
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const currentProfile = userDocSnap.data() || {};

        const newStats = {
            quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
            perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
            totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        
        await updateUserData(newStats);
        
        const historyDocRef = doc(db, 'quizHistory', user.uid);
        const historySnap = await getDoc(historyDocRef);
        const currentHistory = historySnap.exists() ? historySnap.data().attempts || [] : [];
        const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];

        await setDoc(historyDocRef, { attempts: newHistory });

    } catch (error) {
      console.error("Error adding quiz attempt:", error);
      // Revert optimistic update on failure
      setQuizHistory(prev => prev.filter(a => a.timestamp !== attempt.timestamp));
      throw error;
    }
  }, [user, updateUserData]);

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!profile[field]);
  }, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    quizHistory,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isOffline,
    updateUserData,
    addQuizAttempt,
    forceRefreshData,
  }), [user, profile, quizHistory, lastAttempt, isProfileComplete, loading, isOffline, updateUserData, addQuizAttempt, forceRefreshData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
