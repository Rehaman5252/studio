
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
  quizHistory: DocumentData[] | null;
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  quizHistory: null,
  isHistoryLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
        setLoading(false);
        setIsHistoryLoading(false);
        return;
    }
    
    // This listener handles user authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Main loading is complete once we know if there's a user or not.
      if (loading) setLoading(false);
      
      // If user logs out, clear their data.
      if (!currentUser) {
        setUserData(null);
        setQuizHistory(null);
        setIsHistoryLoading(false);
      }
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || !db) {
        // Ensure history is cleared and loading is false if user logs out
        if (quizHistory !== null) setQuizHistory(null);
        if (!isHistoryLoading) setIsHistoryLoading(false);
        return;
    }

    // This listener fetches and subscribes to the user's profile data.
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.exists() ? doc.data() : null);
    }, (error) => {
        console.error("Firestore user data snapshot error:", error);
        setUserData(null);
    });
    
    // This function fetches the user's quiz history once.
    const loadHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const historyCollection = collection(db, 'users', user.uid, 'quizHistory');
            const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const fetchedHistory = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
            setQuizHistory(fetchedHistory);
        } catch (error) {
            console.error("Failed to fetch quiz history:", error);
            setQuizHistory([]); // Set to empty array on error
        } finally {
            setIsHistoryLoading(false);
        }
    };
    
    loadHistory();

    return () => unsubscribeFirestore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = { user, userData, loading, quizHistory, isHistoryLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
