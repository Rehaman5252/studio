
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
import {
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  getDoc,
  DocumentData,
} from 'firebase/firestore';

import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import { getFirebaseAuth, db } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (newData: Partial<any>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return !navigator.onLine;
    return false; // assume online during SSR
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || isOffline) {
        if (!user) setLoading(false);
        return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);

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
        setLoading(false);
    }, (error) => {
        console.error("Profile snapshot error:", error);
        setLoading(false);
    });
    
    return () => {
        unsubProfile();
    }
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
    
    try {
        const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
        
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
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, profile, lastAttempt, isProfileComplete, loading, isOffline, updateUserData, addQuizAttempt]);

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
