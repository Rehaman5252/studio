
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { QuizAttempt } from '@/lib/mockData';

// This represents the structure of user data we store, both in Firestore and locally.
interface UserProfile extends DocumentData {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
}

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

/**
 * A helper function to get the current user from localStorage in demo mode.
 */
const getLocalAuth = () => {
  if (typeof window === 'undefined') {
    return { user: null, userData: null };
  }
  try {
    const email = localStorage.getItem('local_currentUserEmail');
    if (!email) return { user: null, userData: null };

    const users: { [key: string]: UserProfile } = JSON.parse(localStorage.getItem('local_users') || '{}');
    const userData = users[email];

    if (!userData) return { user: null, userData: null };

    // Create a fake Firebase User object that matches the expected type.
    const user: User = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.name,
      photoURL: userData.photoURL,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      providerId: 'local',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'fake-token',
      getIdTokenResult: async () => ({ token: 'fake-token', claims: {}, authTime: '', expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null }),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
    };
    return { user, userData };
  } catch (e) {
    console.error("Error reading local auth:", e);
    return { user: null, userData: null };
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<DocumentData[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  // This function re-checks local storage for the current user.
  // It's used to update the auth state without a full page reload.
  const recheckLocalAuth = useCallback(() => {
    if (!isFirebaseConfigured) {
      const { user: localUser, userData: localUserData } = getLocalAuth();
      setUser(localUser);
      setUserData(localUserData);
      setLoading(false);
    }
  }, []);

  // Main authentication effect. Handles both real Firebase and local demo mode.
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribeAuth = onAuthStateChanged(auth!, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        if (!currentUser) {
          setUserData(null);
          setQuizHistory(null);
          setIsHistoryLoading(false);
        }
      });
      return () => unsubscribeAuth();
    } else {
      // For local demo mode, check storage on initial load and listen for changes.
      recheckLocalAuth();
      window.addEventListener('local-auth-change', recheckLocalAuth);
      return () => window.removeEventListener('local-auth-change', recheckLocalAuth);
    }
  }, [recheckLocalAuth]);
  
  // This effect handles fetching the user's profile data from Firestore for REAL users.
  // For local users, the data is already loaded by `recheckLocalAuth`.
  useEffect(() => {
    if (isFirebaseConfigured && user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.exists() ? doc.data() : null);
      }, (error) => {
        console.error("Firestore user data snapshot error:", error);
        setUserData(null);
      });
      return () => unsubscribeFirestore();
    }
  }, [user]);

  // This effect handles fetching quiz history for both REAL and LOCAL users.
  useEffect(() => {
    if (!user) {
        setQuizHistory(null);
        setIsHistoryLoading(false);
        return;
    }

    setIsHistoryLoading(true);

    if (isFirebaseConfigured && db) {
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
    } else if (!isFirebaseConfigured) {
        // Load local history
        try {
            const localHistoryData = JSON.parse(localStorage.getItem('local_quizHistory') || '{}');
            const userHistory = localHistoryData[user.uid] || [];
            setQuizHistory(userHistory);
        } catch(e) {
            console.error("Error loading local history:", e);
            setQuizHistory([]);
        } finally {
            setIsHistoryLoading(false);
        }
    }
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
