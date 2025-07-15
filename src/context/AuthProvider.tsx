
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, getFirestoreInstance } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData, Firestore } from 'firebase/firestore';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

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
  createUserDocument: (user: User, additionalData?: DocumentData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

async function createUserDocument(db: Firestore, user: User, additionalData: DocumentData = {}) {
    console.log("🔥 createUserDocument:", user);
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
        const snapshot = await getDoc(userDocRef);

        if (!snapshot.exists()) {
            const { email, displayName, photoURL } = user;
            const createdAt = new Date();
            
            await setDoc(userDocRef, {
                uid: user.uid,
                email,
                name: additionalData.name || displayName || 'New User',
                photoURL: photoURL || `https://placehold.co/100x100.png`,
                createdAt,
                emailVerified: user.emailVerified,
                quizzesPlayed: 0,
                perfectScores: 0,
                totalRewards: 0,
                profileCompleted: false,
                referralCode: `indcric.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0,4)}`,
                referralEarnings: 0,
                ...additionalData
            });
            console.log("✅ User document created in Firestore");
        }
    } catch (error) {
        console.error("❌ Error creating user document:", error);
        toast({ title: "Error", description: "Could not save user profile.", variant: "destructive" });
        throw error;
    }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const db = useMemo(() => isFirebaseConfigured ? getFirestoreInstance() : null, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    const authSub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Ensure user document is created on sign in
        await createUserDocument(db, currentUser);
      } else {
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
    });

    return () => authSub();
  }, [db]);

  useEffect(() => {
    if (!user || !db) {
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }
    
    let unsubscribeUser: () => void;
    let unsubscribeHistory: () => void;

    const setupListeners = async () => {
        try {
            setIsUserDataLoading(true);
            const userDocRef = doc(db, 'users', user.uid);

            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                setUserData(docSnap.data() || null);
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

            setIsHistoryLoading(true);
            const historyDocRef = doc(db, 'quizHistory', user.uid);
            unsubscribeHistory = onSnapshot(historyDocRef, (docSnap) => {
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
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user, db]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user) throw new Error("Not authenticated");
    if (!db) throw new Error("Database not initialized");
    const userDocRef = doc(db, 'users', user.uid);
    console.log('Backend update:', newData);
    await updateDoc(userDocRef, newData);
  }, [user, db]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");
    
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
  }, [user, quizHistory, userData, db]);

  const handleCreateUserDocument = useCallback(async (userToCreate: User, additionalData?: DocumentData) => {
    if (!db) throw new Error("Database not initialized");
    await createUserDocument(db, userToCreate, additionalData);
  }, [db]);

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
    createUserDocument: handleCreateUserDocument,
  }), [user, userData, quizHistory, lastAttempt, isProfileComplete, loading, isUserDataLoading, isHistoryLoading, updateUserData, addQuizAttempt, handleCreateUserDocument]);

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
