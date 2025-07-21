
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  quizHistory: QuizAttempt[];
  fetchHistory: () => Promise<void>;
  historyLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // New state for caching quiz history
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);


  useEffect(() => {
    if (typeof window === 'undefined') return;
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
        setQuizHistory([]); // Clear history on logout
        return; 
    }
    
    let unsubProfile: () => void = () => {};
    
    setLoading(true);

    const setupListeners = async () => {
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore is not available.");
        setIsOffline(true);
        setLoading(false);
        return;
      }
      
      const online = await isFirebaseOnline();
      setIsOffline(!online);
      if (!online) {
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          await createUserDocument(user);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile snapshot error:", error);
        setIsOffline(true);
        setLoading(false);
      });
      
    };
    
    setupListeners();
    
    return () => {
        unsubProfile();
    };
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or database not available.");
    
    const sanitizedData = sanitizeUserProfile(newData);
    
    setProfile(prev => {
        const updated = { ...(prev || {}), ...newData };
        setIsProfileComplete(!!updated.profileCompleted);
        return updated;
    });
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizedData, { merge: true });
  }, [user]);
  
  // New function to fetch history on demand and cache it
  const fetchHistory = useCallback(async () => {
      if (!user || historyLoading) return;
      
      const db = getFirebaseFirestore();
      if (!db) {
          console.error("Firestore not available for history fetch.");
          return;
      }

      setHistoryLoading(true);
      try {
          const q = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"));
          const querySnapshot = await getDocs(q);
          const historyData = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
          setQuizHistory(historyData);
      } catch (e: any) {
          console.error("Failed to fetch certificate data:", e);
      } finally {
          setHistoryLoading(false);
      }
  }, [user, historyLoading]);


  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    
    if (updateUserData) {
        setProfile(currentProfile => {
            const newStats = {
              quizzesPlayed: (currentProfile?.quizzesPlayed || 0) + 1,
              perfectScores: (currentProfile?.perfectScores || 0) + (isPerfect ? 1 : 0),
              totalRewards: (currentProfile?.totalRewards || 0) + (isPerfect ? 100 : 0),
            };
            updateUserData(newStats); 
            return { ...(currentProfile || {}), ...newStats };
        });
    }
    
    // Add new attempt to the local cache immediately for instant UI update
    setQuizHistory(prev => [sanitizedAttempt, ...prev]);

    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, updateUserData]);
  
  const value = useMemo(() => ({
    user, profile, loading, isOffline, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete,
    quizHistory, fetchHistory, historyLoading
  }), [user, profile, loading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, quizHistory, fetchHistory, historyLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
