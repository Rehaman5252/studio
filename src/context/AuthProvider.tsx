
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth, isFirebaseConfigured } from '@/lib/firebase';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData, Firestore } from 'firebase/firestore';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc,
  initializeFirestore,
  memoryLocalCache
} from 'firebase/firestore';

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
  
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && app && typeof window !== 'undefined' && !db) {
      console.log("Attempting to initialize Firestore on the client...");
      try {
        const firestoreInstance = initializeFirestore(app, {
          localCache: memoryLocalCache(),
        });
        setDb(firestoreInstance);
        console.log("✅ Firestore initialized successfully with memory cache.");
      } catch (error: any) {
        console.error("❌ Error initializing Firestore", error);
        setDb(null);
      }
    } else if (!isFirebaseConfigured) {
        console.warn("Firebase is not configured. Skipping initialization.");
        setIsAuthLoading(false);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
    }
  }, [db]);
  
  useEffect(() => {
    if (!auth) {
      console.log("Auth service not available, skipping auth state listener.");
      setIsAuthLoading(false);
      return;
    };

    const authSub = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed. User:", currentUser?.uid || 'null');
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
  }, []);

  useEffect(() => {
    if (!user || !db) {
      if (!user) { 
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
      return;
    }
    
    console.log(`Setting up Firestore listeners for user ${user.uid} because DB and user are ready.`);
    let unsubscribeUser: () => void;
    let unsubscribeHistory: () => void;

    const setupListeners = async () => {
        // Guard against running if user or db isn't ready
        if (!user || !db) {
            console.warn("⛔️ Cannot set up listeners, user or db is missing.");
            return;
        }

        try {
            // Pass the db instance explicitly
            await createUserDocument(db, user, {});

            setIsUserDataLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                console.log("Received user data snapshot.");
                setUserData(docSnap.data() || null);
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

            setIsHistoryLoading(true);
            const historyDocRef = doc(db, 'quizHistory', user.uid);
            unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
                console.log("Received quiz history snapshot.");
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setQuizHistory(data.attempts || []);
                } else {
                    setQuizHistory([]);
                }
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
      console.log("Cleaning up Firestore listeners.");
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user, db]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) {
      console.error("updateUserData failed: User not authenticated");
      throw new Error("Not authenticated");
    }

    let readyDb = db;
    if (!readyDb) {
      console.warn("⏳ Waiting for Firestore to initialize in updateUserData...");
      // Wait up to 2 seconds for db to be ready
      await new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
          setDb(currentDb => {
            if (currentDb) {
              readyDb = currentDb;
              clearInterval(interval);
              resolve();
            } else if (Date.now() - start > 2000) {
              clearInterval(interval);
              reject(new Error("Firestore failed to initialize in time."));
            }
            return currentDb;
          })
        }, 100);
      });
    }

    if (!readyDb) throw new Error("Firestore still not ready after waiting.");

    console.log("✅ Updating user data with payload:", newData);
    const userDocRef = doc(readyDb, "users", user.uid);
    await updateDoc(userDocRef, newData);
    console.log("✅ User data updated successfully.");
  }, [user, db]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db) throw new Error("User not authenticated or DB not ready");
    
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
        await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });
        await updateDoc(userDocRef, userUpdatePayload);
    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, db, quizHistory, userData]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return userData.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const isDbReady = !!db;
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
