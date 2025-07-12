
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { db, app } from '@/lib/firebase';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import type { QuizAttempt } from '@/lib/mockData';
import { collection, query, orderBy, limit } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
  isUserDataLoading: boolean;
  isProfileComplete: boolean;
  quizHistory: QuizAttempt[];
  isHistoryLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isUserDataLoading: true,
  isProfileComplete: false,
  quizHistory: [],
  isHistoryLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true); // Auth loading
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeUser: () => void;
    let unsubscribeHistory: () => void;
    
    if (user && db) {
        setIsUserDataLoading(true);
        setIsHistoryLoading(true);

        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            setUserData(doc.data() || null);
            setIsUserDataLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setIsUserDataLoading(false);
        });
        
        const historyCollectionRef = collection(db, 'users', user.uid, 'quizHistory');
        const historyQuery = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(50));
        unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
            const history = snapshot.docs.map(doc => doc.data() as QuizAttempt);
            setQuizHistory(history);
            setIsHistoryLoading(false);
        }, (error) => {
            console.error("Error fetching quiz history:", error);
            setIsHistoryLoading(false);
        });

    } else {
        setUserData(null);
        setQuizHistory([]);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
    }
    
    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user]);
  
  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return !!userData.profileCompleted;
  }, [userData]);

  const value = { 
      user, 
      userData, 
      loading, 
      isUserDataLoading,
      isProfileComplete,
      quizHistory,
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
