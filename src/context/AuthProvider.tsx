
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';
import { 
  doc, 
  onSnapshot, 
  setDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isOffline: boolean;
  updateUserData?: (newData: Partial<DocumentData>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isFirebaseConfigured) {
      console.warn("Firebase not configured or not in a client environment. Auth will not work.");
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      return;
    }
    
    const auth = getFirebaseAuth();
    if (!auth) {
        setIsAuthLoading(false);
        setIsUserDataLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Wait for auth check to complete and ensure we are on the client
    if (isAuthLoading || typeof window === 'undefined') return;
    
    const db = getFirebaseFirestore();
    if (!db) {
        setIsUserDataLoading(false);
        return;
    }

    if (!user) {
      setUserData(null);
      setIsUserDataLoading(false);
      return;
    }

    setIsUserDataLoading(true);

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribeUser = onSnapshot(userDocRef, 
      (docSnap) => {
        if (!docSnap.exists()) {
          createUserDocument(user).then(() => {
             // The listener will re-trigger with the new data, so we just wait.
          }).catch(err => {
            console.error("Failed to create user document on-the-fly:", err);
            setIsUserDataLoading(false);
          });
        } else {
          const data = docSnap.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setUserData(data || null);
          setIsUserDataLoading(false);
        }
      }, 
      (error) => {
          console.error("Error listening to user document:", error);
          if (error.code === 'unavailable') {
              setIsOffline(true);
          }
          setIsUserDataLoading(false);
      }
    );

    return () => unsubscribeUser();
  }, [user, isAuthLoading]);

  const loading = useMemo(() => {
    return isAuthLoading || (!!user && isUserDataLoading);
  }, [isAuthLoading, user, isUserDataLoading]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) {
      console.error("❌ updateUserData: No user or DB not available.");
      throw new Error("Could not save profile. Please check your connection and try again.");
    }
    
    // Optimistic update
    setUserData(prev => ({ ...prev, ...newData }));
    
    const sanitizedData = sanitizeUserProfile(newData);
  
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");
    
    const currentUserData = userData ? { ...userData } : {};
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newQuizzesPlayed = (currentUserData.quizzesPlayed || 0) + 1;
    const newPerfectScores = (currentUserData.perfectScores || 0) + (isPerfect ? 1 : 0);
    const newTotalRewards = (currentUserData.totalRewards || 0) + (isPerfect ? 100 : 0);

    const userUpdatePayload = {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards
    };
    
    setUserData(prev => ({ ...prev, ...userUpdatePayload }));
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, sanitizeUserProfile(userUpdatePayload), { merge: true });
        
        const historyDocRef = doc(db, 'quizHistory', user.uid);
        const historySnap = await getDoc(historyDocRef);
        const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
        const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];
        await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });

    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, userData]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return userData.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);


  const value = useMemo(() => ({
    user,
    userData,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, userData, lastAttempt, isProfileComplete, loading, isUserDataLoading, isOffline, updateUserData, addQuizAttempt]);

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
