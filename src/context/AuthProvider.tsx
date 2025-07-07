
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

    // This is the single listener for authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Auth state is now known.

      if (!currentUser) {
        // User is logged out, clear all user-specific data and stop listening.
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      // No user or db, so we are not loading any data.
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      setUserData(null);
      setQuizHistory(null);
      return;
    }

    // A user is signed in. Set up Firestore listeners.
    setIsUserDataLoading(true);
    setIsHistoryLoading(true);

    // 1. Listener for the user's profile document.
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Self-healing: The user is authenticated, but their document is missing. Create it.
        // This is a fire-and-forget write that will be queued if offline.
        console.log(`User document for ${user.uid} not found, creating it...`);
        const newUserDoc = {
            uid: user.uid,
            name: user.displayName || 'New User',
            email: user.email,
            phone: user.phoneNumber || '',
            createdAt: serverTimestamp(),
            totalRewards: 0,
            quizzesPlayed: 0,
            referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
            photoURL: user.photoURL || '',
            age: '',
            gender: '',
            occupation: '',
            upi: '',
            highestStreak: 0,
            certificatesEarned: 0,
            referralEarnings: 0,
        };
        setDoc(userDocRef, newUserDoc).catch(error => {
          console.error("Failed to self-heal and create user document:", error);
        });
      }
      setIsUserDataLoading(false);
    }, (error) => {
      console.error("Error listening to user profile:", error);
      setUserData(null);
      setIsUserDataLoading(false);
    });

    // 2. Listener for quiz history.
    const historyCollectionRef = collection(db, 'users', user.uid, 'quizHistory');
    const q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeHistory = onSnapshot(q, (querySnapshot) => {
      setQuizHistory(querySnapshot.docs.map(doc => doc.data() as QuizAttempt));
      setIsHistoryLoading(false);
    }, (error) => {
      console.error("Error listening to quiz history:", error);
      setQuizHistory([]);
      setIsHistoryLoading(false);
    });

    // Return cleanup function to unsubscribe from listeners when user changes.
    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
    };
  }, [user]); // This entire effect re-runs ONLY when the user object changes.

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
