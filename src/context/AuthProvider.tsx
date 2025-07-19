
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
import { auth, db, isFirebaseConfigured } from '@/lib/firebaseClient';

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
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.error("Firebase is not configured. Aborting AuthProvider setup.");
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    let firestoreUnsubscribe: (() => void) | undefined;

    const setupListeners = async (firebaseUser: User) => {
      // This function is now self-contained and only runs for a valid user.
      setIsUserDataLoading(true);
      setIsHistoryLoading(true);

      try {
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
        
        // Return a single cleanup function.
        return () => {
          unsubscribeUser();
          unsubscribeHistory();
        };
      } catch (error) {
        console.error("🔥 Firestore listener setup failed:", error);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
        return () => {}; // Return empty cleanup on failure.
      }
    };
    
    // DEFINITIVE FIX: Force network online *before* attaching auth listener.
    enableNetwork(db).then(() => {
      console.log("✅ Firestore client is now online.");
      
      const authSub = onAuthStateChanged(auth, async (firebaseUser) => {
        // Cleanup previous user's listeners if any.
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
        }

        setUser(firebaseUser);
        setIsAuthLoading(false);

        if (firebaseUser) {
          // If there's a new user, set up their listeners.
          firestoreUnsubscribe = await setupListeners(firebaseUser);
        } else {
          // No user, reset all data and loading states.
          setUserData(null);
          setQuizHistory(null);
          setIsUserDataLoading(false);
          setIsHistoryLoading(false);
        }
      });
      
      // Return the auth subscription cleanup to the main useEffect.
      return () => {
        authSub();
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
        }
      };
    }).catch((err) => {
        console.error("❌ Failed to enable Firestore network. App may not function correctly.", err);
        setIsAuthLoading(false);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
    });

  }, []);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) {
      console.error("❌ updateUserData: No user");
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
    if (!user) throw new Error("User not authenticated or DB not available.");
    
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
    updateUserData,
    addQuizAttempt,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, updateUserData, addQuizAttempt]);

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
