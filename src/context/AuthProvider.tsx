'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { db, isFirebaseConfigured, app } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, type DocumentData } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
  isUserDataLoading: boolean;
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
    if (!isFirebaseConfigured || !app) {
      setLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      console.warn("Firebase is not configured. Authentication and user data will not be available.");
      return;
    }

    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db) {
      setIsUserDataLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
        setIsUserDataLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setUserData(null);
        setIsUserDataLoading(false);
      });

      setIsHistoryLoading(true);
      const historyRef = collection(db, 'users', user.uid, 'quizHistory');
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const unsubscribeHistory = onSnapshot(q, (snapshot) => {
        const historyData: DocumentData[] = [];
        snapshot.forEach((doc) => {
          historyData.push({ ...doc.data(), id: doc.id });
        });
        setQuizHistory(historyData);
        setIsHistoryLoading(false);
      }, (error) => {
        console.error("Error fetching quiz history:", error);
        setQuizHistory(null);
        setIsHistoryLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeHistory();
      };
    } else {
      // No user, clear data
      setUserData(null);
      setQuizHistory(null);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
    }
  }, [user]);

  const value = { 
    user,
    userData,
    loading,
    isUserDataLoading,
    quizHistory,
    isHistoryLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
