
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { DocumentData } from 'firebase/firestore';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  isProfileComplete: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  userData: any | null;
  isUserDataLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
      }

      try {
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) {
          setLoading(false);
          return;
        }

        const ref = doc(db, "users", user.uid);
        const userDoc = await getDoc(ref);

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split("T")[0];
          }
          setProfile(data);
        } else {
          // If doc doesn't exist, create it.
          await createUserDocument(user);
          const newUserDoc = await getDoc(ref); // Re-fetch after creation
          if(newUserDoc.exists()) {
            setProfile(newUserDoc.data());
          } else {
            setProfile(null); // Should not happen if creation is successful
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setIsOffline(true);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User or DB not available");
    
    setProfile(prev => ({ ...prev, ...newData })); // Optimistic update
    await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(newData), { merge: true });
  }, [user]);
  
  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const historyDocRef = doc(db, 'quizHistory', user.uid);

    try {
        const historySnap = await getDoc(historyDocRef);
        const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
        const newHistory = [sanitizedAttempt, ...currentHistory];
        await setDoc(historyDocRef, { attempts: newHistory });

        if (updateUserData) {
          const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
          const newStats = {
            quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
            perfectScores: (profile?.perfectScores || 0) + (isPerfect ? 1 : 0),
            totalRewards: (profile?.totalRewards || 0) + (isPerfect ? 100 : 0),
          };
          await updateUserData(newStats);
        }
    } catch(err) {
      console.error("Failed to add quiz attempt", err);
    }
  }, [user, profile, updateUserData]);
  
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!profile[field]);
  }, [profile]);

  const value = {
    user,
    profile,
    loading,
    isOffline,
    isProfileComplete,
    updateUserData,
    addQuizAttempt,
    lastAttempt,
    setLastAttempt,
    userData: profile,
    isUserDataLoading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
