
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean; // Tracks auth state readiness
  isUserDataLoading: boolean; // Tracks Firestore user doc loading
  quizHistory: DocumentData[] | null;
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isUserDataLoading: true,
  quizHistory: null,
  isHistoryLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setUserData(null);
        setQuizHistory(null);
        setIsHistoryLoading(false);
        setIsUserDataLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (user && db) {
      setIsUserDataLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.exists() ? doc.data() : null);
        setIsUserDataLoading(false);
      }, (error) => {
        console.error("Firestore user data snapshot error:", error);
        setUserData(null);
        setIsUserDataLoading(false);
      });
      return () => unsubscribeFirestore();
    } else {
        setIsUserDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !db) {
        setQuizHistory(null);
        setIsHistoryLoading(false);
        return;
    }

    setIsHistoryLoading(true);
    
    const loadHistory = async () => {
        try {
            const historyCollection = collection(db, 'users', user.uid, 'quizHistory');
            const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            setQuizHistory(querySnapshot.docs.map(doc => doc.data() as QuizAttempt));
        } catch (error) {
            console.error("Failed to fetch quiz history:", error);
            setQuizHistory([]);
        } finally {
            setIsHistoryLoading(false);
        }
    };
    loadHistory();

  }, [user]);

  const value = { user, userData, loading, isUserDataLoading, quizHistory, isHistoryLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
