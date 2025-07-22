
'use client';
/**
 * @fileOverview AuthProvider
 *
 * This is the central provider for all user-related data, including authentication
 * state, user profile, and quiz history. It follows a lean data-loading strategy.
 *
 * 1.  **Authentication**: Listens for Firebase auth state changes.
 * 2.  **Profile Management**: On login, it fetches the user's profile document from
 *     Firestore with a real-time listener. If a profile doesn't exist for a new
 *     user, it creates one automatically.
 * 3.  **Quiz History**: It also attaches a real-time listener to the user's
 *     'quizAttempts' sub-collection, making history available throughout the app
 *     without requiring individual components to re-fetch it.
 * 4.  **Connectivity**: Uses `monitorFirebaseConnection` to provide a reliable
 *     `isOffline` flag for the entire application.
 */

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, Timestamp, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, monitorFirebaseConnection } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  quizHistory: QuizAttempt[];
  loading: boolean; // True while waiting for auth and initial profile
  historyLoading: boolean; // True while waiting for quiz history
  isOffline: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  // Monitor Firebase connection status globally.
  useEffect(() => {
    const unsubscribe = monitorFirebaseConnection(setIsOffline);
    return () => unsubscribe();
  }, []);
  
  // Listen for changes in authentication state.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // When user logs in, set up real-time listeners for their profile and quiz history.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setQuizHistory([]);
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    setLoading(true);
    setHistoryLoading(true);
    const db = getFirebaseFirestore();

    // Listener for the user's profile document.
    const userDocRef = doc(db, "users", user.uid);
    const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore Timestamps to a format the <Input type="date"> can use.
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
      } else {
        // If the user document doesn't exist, create it.
        await createUserDocument(user);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setLoading(false);
    });

    // Listener for the user's quiz history sub-collection.
    const historyQuery = query(collection(db, `users/${user.uid}/quizAttempts`), orderBy("timestamp", "desc"));
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => doc.data() as QuizAttempt);
      setQuizHistory(historyData);
      setHistoryLoading(false);
    }, (error) => {
      console.error("History snapshot error:", error);
      setHistoryLoading(false);
    });

    // Cleanup listeners on component unmount or user change.
    return () => {
      unsubProfile();
      unsubHistory();
    };
  }, [user]);

  // Callback to update user data in Firestore.
  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const db = getFirebaseFirestore();
    const userDocRef = doc(db, "users", user.uid);
    // Sanitize data before sending to Firestore (e.g., remove undefined fields).
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  // Callback to add a new quiz attempt and update user stats.
  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    const db = getFirebaseFirestore();
    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);

    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const currentProfile = profile || {};
    const newStats = {
      quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
      perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    
    // Update both user stats and the quiz attempt record.
    await updateUserData(newStats);
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });
  }, [user, profile, updateUserData]);

  const isProfileComplete = !!profile?.profileCompleted;

  // Memoize context value to prevent unnecessary re-renders of consuming components.
  const value = useMemo(() => ({
    user, profile, quizHistory, loading, historyLoading, isOffline, 
    updateUserData, addQuizAttempt, lastAttempt, setLastAttempt, isProfileComplete
  }), [user, profile, quizHistory, loading, historyLoading, isOffline, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily access the AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
