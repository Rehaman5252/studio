
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean; // Tracks overall readiness (auth + user data)
  isUserDataLoading: boolean; // Specifically tracks Firestore doc loading
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

// This is the single source of truth for creating or getting a user document.
// It prevents race conditions during sign-up.
const getUserDocument = async (uid: string, displayName?: string | null, email?: string | null, photoURL?: string | null, phoneNumber?: string | null) => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', uid);
    
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Document doesn't exist, so create it.
            const newUserDoc = {
                uid: uid,
                name: displayName || 'New User',
                email: email || '',
                phone: phoneNumber || '',
                createdAt: serverTimestamp(),
                photoURL: photoURL || '',
                // Initialize all other fields to prevent app errors
                totalRewards: 0,
                quizzesPlayed: 0,
                perfectScores: 0,
                referralCode: `indcric.com/ref/${uid.slice(0, 8)}`,
                dob: '',
                gender: '',
                occupation: '',
                upi: '',
                highestStreak: 0,
                certificatesEarned: 0,
                referralEarnings: 0,
                favoriteFormat: '',
                favoriteTeam: '',
                favoriteCricketer: '',
            };
            await setDoc(userDocRef, newUserDoc);
            return newUserDoc;
        }
    } catch (error) {
        console.error("Error getting/creating user document:", error);
        return null; // Return null on error
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Only for auth state
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setIsUserDataLoading(true);
        // User is logged in, fetch or create their document.
        const profile = await getUserDocument(currentUser.uid, currentUser.displayName, currentUser.email, currentUser.photoURL, currentUser.phoneNumber);
        setUserData(profile);
        setIsUserDataLoading(false);
      } else {
        // User is logged out, clear all data.
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
      setQuizHistory(null);
      setIsHistoryLoading(false);
      return;
    }

    // A user is signed in, set up listener for their quiz history.
    setIsHistoryLoading(true);
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

    return () => unsubscribeHistory();
  }, [user]); // This effect re-runs ONLY when the user object changes.

  const value = { 
    user, 
    userData, 
    loading: authLoading || isUserDataLoading, // Combined loading state for consumers
    isUserDataLoading, 
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
  return useContext(AuthContext);
};
