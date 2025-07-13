
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  isProfileComplete: boolean;
  loading: boolean; // Simplified single loading state
  isUserDataLoading: boolean; // Kept for specific UI elements if needed
  isHistoryLoading: boolean; // Kept for specific UI elements if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
    'name', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Specific loading states can still be useful for granular UI updates
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true); // Start loading whenever auth state might change
      setUser(currentUser);
      if (!currentUser) {
        // If no user, reset all data and stop loading
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      // User is logged in, start fetching data
      setIsUserDataLoading(true);
      setIsHistoryLoading(true);
      
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          setUserData(doc.data() ?? null);
          setIsUserDataLoading(false);
      }, (error) => {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setIsUserDataLoading(false);
      });

      const historyDocRef = doc(db, 'quizHistory', user.uid);
      const unsubscribeHistory = onSnapshot(historyDocRef, (doc) => {
        const historyData = doc.data();
        setQuizHistory(historyData?.attempts || []);
        setIsHistoryLoading(false);
      }, (error) => {
          console.error("Error fetching quiz history:", error);
          setQuizHistory([]);
          setIsHistoryLoading(false);
      });

      // Cleanup listeners on unmount or user change
      return () => {
          unsubscribeUser();
          unsubscribeHistory();
      };
    }
  }, [user]);

  useEffect(() => {
    // This effect determines the final loading state
    if (user === undefined) { // Auth state not yet determined
        setLoading(true);
    } else if (user === null) { // User is logged out
        setLoading(false);
    } else { // User is logged in, wait for data
        if (!isUserDataLoading && !isHistoryLoading) {
            setLoading(false);
        }
    }
  }, [user, isUserDataLoading, isHistoryLoading]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);

  const value = { 
    user, 
    userData, 
    quizHistory, 
    isProfileComplete, 
    loading, 
    isUserDataLoading, 
    isHistoryLoading 
  };

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
