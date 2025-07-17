
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
} from 'firebase/firestore';
import { getFirebaseClient } from '@/lib/firebaseClient';

/**
 * Removes properties with `undefined` values from an object.
 * Firestore does not support `undefined` and will throw an error.
 * This is crucial for sanitizing data before sending it to Firestore.
 * @param obj The object to sanitize.
 * @returns A new object with `undefined` properties removed.
 */
function removeUndefined(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
  isHistoryLoading: boolean;
  isDbReady: boolean;
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
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  const [isDbReady, setIsDbReady] = useState(false);
  
  useEffect(() => {
    async function checkDb() {
        try {
            await getFirebaseClient();
            setIsDbReady(true);
        } catch (error) {
            console.error("DB readiness check failed:", error);
            setIsDbReady(false);
        }
    }
    checkDb();
  }, [])


  useEffect(() => {
    const initializeAuth = async () => {
        try {
            const { auth } = await getFirebaseClient();
            const authSub = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setIsAuthLoading(false);
                
                if (!currentUser) {
                    setUserData(null);
                    setQuizHistory(null);
                    setIsUserDataLoading(false);
                    setIsHistoryLoading(false);
                }
            });
            return () => authSub();
        } catch (error) {
            console.error("Failed to initialize Firebase Auth listener:", error);
            setIsAuthLoading(false);
        }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
        unsubscribePromise.then(unsub => unsub && unsub());
    };
}, []);

  useEffect(() => {
    if (!user) {
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }
    
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeHistory: (() => void) | undefined;

    const setupListeners = async () => {
        try {
            const { db } = await getFirebaseClient();
            
            await createUserDocument(user);

            const userDocRef = doc(db, 'users', user.uid);
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                setUserData(docSnap.data() || null);
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

            const historyDocRef = doc(db, 'quizHistory', user.uid);
            unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
                const historyData = docSnap.exists() ? (docSnap.data().attempts || []) : [];
                // Sort history by timestamp descending to have the latest attempt first
                historyData.sort((a: QuizAttempt, b: QuizAttempt) => b.timestamp - a.timestamp);
                setQuizHistory(historyData);
                setIsHistoryLoading(false);
            }, (error) => {
                console.error("Error listening to quiz history:", error);
                setIsHistoryLoading(false);
            });
        } catch (error) {
            console.error("Failed to set up Firestore listeners:", error);
            setIsUserDataLoading(false);
            setIsHistoryLoading(false);
        }
    };
    
    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) {
      console.error("❌ updateUserData: No user");
      throw new Error("User not authenticated");
    }
  
    try {
      const { db } = await getFirebaseClient();
      const ref = doc(db, 'users', user.uid);
      // Use setDoc with merge:true to safely create or update the document.
      await setDoc(ref, newData, { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      throw err;
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated");
    
    const { db } = await getFirebaseClient();
    const currentHistory = quizHistory || [];
    const currentUserData = userData || {};

    const historyDocRef = doc(db, 'quizHistory', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    
    const newHistory = [attempt, ...currentHistory];
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newQuizzesPlayed = (currentUserData?.quizzesPlayed || 0) + 1;
    const newPerfectScores = (currentUserData?.perfectScores || 0) + (isPerfect ? 1 : 0);
    const newTotalRewards = (currentUserData?.totalRewards || 0) + (isPerfect ? 100 : 0);

    const userUpdatePayload = {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards
    };

    try {
        // Sanitize payloads to remove any 'undefined' values before sending to Firestore
        const sanitizedHistory = { attempts: newHistory.map(a => removeUndefined(a)) };
        const sanitizedUserUpdate = removeUndefined(userUpdatePayload);

        await setDoc(historyDocRef, sanitizedHistory, { merge: true });
        await setDoc(userDocRef, sanitizedUserUpdate, { merge: true });
    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, quizHistory, userData]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return userData.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const loading = isAuthLoading || (!!user && (isUserDataLoading || isHistoryLoading));

  const value = useMemo(() => ({
    user,
    userData,
    quizHistory,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isHistoryLoading,
    isDbReady,
    updateUserData,
    addQuizAttempt,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, isDbReady, updateUserData, addQuizAttempt]);

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
