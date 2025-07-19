
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
  enableNetwork,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, isReallyOnline } from '@/lib/firebaseClient';

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
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState(true); // Start assuming offline

  useEffect(() => {
    // This effect runs only on the client and handles Firebase auth state.
    if (!isFirebaseConfigured || !auth) {
      console.warn("Firebase not configured for the client. Auth will not work.");
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    // Add online/offline listeners to react to network changes
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    isReallyOnline().then(online => setIsOffline(!online));

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // This effect handles fetching Firestore data once we have a user and are online.
    if (!user || isOffline || !db) {
      // If we're not logged in or are offline, we can't fetch data.
      // We set loading to false because there's nothing to load.
      if (!user) {
        setUserData(null);
        setQuizHistory(null);
      }
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }
    
    // At this point, user is logged in and we are online.
    setIsUserDataLoading(true);
    setIsHistoryLoading(true);
    
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeHistory: (() => void) | undefined;

    const setupFirestoreListeners = async () => {
        try {
            await createUserDocument(user);
            
            const userDocRef = doc(db, 'users', user.uid);
            const historyDocRef = doc(db, 'quizHistory', user.uid);
            
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                setUserData(docSnap.data() || null);
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

            unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
                const historyData = docSnap.exists() ? (docSnap.data().attempts || []) : [];
                historyData.sort((a: QuizAttempt, b: QuizAttempt) => b.timestamp - a.timestamp);
                setQuizHistory(historyData);
                setIsHistoryLoading(false);
            }, (error) => {
                console.error("Error listening to quiz history:", error);
                setIsHistoryLoading(false);
            });

        } catch (error) {
            console.error("🔥 Firestore listener setup failed:", error);
            setIsUserDataLoading(false);
            setIsHistoryLoading(false);
        }
    };
    
    setupFirestoreListeners();

    return () => {
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user, isOffline]);

  const loading = useMemo(() => {
    return isAuthLoading || (!!user && (isUserDataLoading || isHistoryLoading));
  }, [isAuthLoading, user, isUserDataLoading, isHistoryLoading]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user || !db || isOffline) {
      console.error("❌ updateUserData: No user, DB not available, or client is offline.");
      throw new Error("Could not save profile. Please check your connection and try again.");
    }
  
    try {
      const ref = doc(db, 'users', user.uid);
      
      const payload = { ...newData };
      // This is the crucial fix for the profile saving issue.
      if (payload.dob && typeof payload.dob === 'string') {
        payload.dob = new Date(payload.dob);
      }

      await setDoc(ref, removeUndefined(payload), { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user, isOffline]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db || isOffline) throw new Error("User not authenticated, DB not available, or client is offline.");
    
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
        const sanitizedHistory = { attempts: newHistory.map(a => removeUndefined(a)) };
        const sanitizedUserUpdate = removeUndefined(userUpdatePayload);

        await setDoc(historyDocRef, sanitizedHistory, { merge: true });
        await setDoc(userDocRef, sanitizedUserUpdate, { merge: true });
    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, quizHistory, userData, isOffline]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return userData.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);


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
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, isOffline, updateUserData, addQuizAttempt]);

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
