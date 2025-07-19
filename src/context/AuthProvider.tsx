
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
  
  const [loading, setLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // This state ensures children are not rendered until Firebase is fully ready.
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseConfigured || !auth || !db) {
      console.warn("Firebase not configured or not in a client environment.");
      setLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      setIsFirebaseInitialized(true);
      return;
    }

    // Unregister any stale service workers that might be forcing an offline state.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
                console.log('Unregistered stale service worker.');
            }
        });
    }

    let unsubscribeFirestore: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // First, clean up any previous listeners
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
      
      setUser(firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        setIsUserDataLoading(true);
        setIsHistoryLoading(true);

        const online = await isReallyOnline();
        if (!online) {
          console.error("Firebase AuthProvider: Client is offline. Halting Firestore setup.");
          setUserData(null);
          setQuizHistory(null);
          setLoading(false);
          setIsUserDataLoading(false);
          setIsHistoryLoading(false);
          return; // Stop further execution if offline
        }

        try {
          // Explicitly enable network
          await enableNetwork(db);
          console.log("✅ Firestore network enabled.");

          await createUserDocument(firebaseUser);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const historyDocRef = doc(db, 'quizHistory', firebaseUser.uid);

          const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
              setUserData(docSnap.data() || null);
              setIsUserDataLoading(false);
          }, (error) => {
              console.error("Error listening to user document:", error);
              setIsUserDataLoading(false);
          });

          const unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
              const historyData = docSnap.exists() ? (docSnap.data().attempts || []) : [];
              historyData.sort((a: QuizAttempt, b: QuizAttempt) => b.timestamp - a.timestamp);
              setQuizHistory(historyData);
              setIsHistoryLoading(false);
          }, (error) => {
              console.error("Error listening to quiz history:", error);
              setIsHistoryLoading(false);
          });

          unsubscribeFirestore = () => {
            unsubscribeUser();
            unsubscribeHistory();
          };

        } catch (error) {
          console.error("🔥 Firestore listener setup failed:", error);
          setUserData(null);
          setQuizHistory(null);
          setIsUserDataLoading(false);
          setIsHistoryLoading(false);
        } finally {
            // Loading state will be set to false inside the snapshot listeners
        }
      } else {
        // No user, reset everything
        setUserData(null);
        setQuizHistory(null);
        setLoading(false);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
    });

    setIsFirebaseInitialized(true);

    return () => {
      authUnsubscribe();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  useEffect(() => {
      // Consolidate loading state
      const newLoadingState = !isFirebaseInitialized || (!!user && (isUserDataLoading || isHistoryLoading));
      if (newLoadingState !== loading) {
          setLoading(newLoadingState);
      }
  }, [isFirebaseInitialized, user, isUserDataLoading, isHistoryLoading, loading]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user || !db) {
      console.error("❌ updateUserData: No user or DB not available.");
      throw new Error("User not authenticated or DB not available.");
    }
  
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, removeUndefined(newData), { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      throw err;
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db) throw new Error("User not authenticated or DB not available.");
    
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
  }, [user, quizHistory, userData]);

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
    updateUserData,
    addQuizAttempt,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, updateUserData, addQuizAttempt]);

  if (!isFirebaseInitialized) {
    return null; 
  }

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
