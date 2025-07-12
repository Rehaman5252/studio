
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import type { QuizAttempt } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  quizHistory: QuizAttempt[] | null;
  isProfileComplete: boolean;
  loading: boolean; // True until the initial auth check is complete
  isUserDataLoading: boolean; // True while user-specific data is fetching
  isHistoryLoading: boolean; // True while history is fetching
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
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  
  // This is the main loading state for the initial auth check.
  const [loading, setLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Auth check is complete, set loading to false.
      setLoading(false); 
      if (!currentUser) {
        // If no user, no data will be fetched, so set all loading states to false.
        setUserData(null);
        setQuizHistory(null);
        setIsUserDataLoading(false);
        setIsHistoryLoading(false);
        setIsProfileComplete(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Only fetch data if we have a user
    if (user?.uid) {
        setIsUserDataLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            const data = doc.data();
            setUserData(data ?? null);

            // Check profile completion
            if (data) {
                const completed = MANDATORY_PROFILE_FIELDS.every(field => !!data[field]);
                setIsProfileComplete(completed);
            } else {
                setIsProfileComplete(false);
            }
            setIsUserDataLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setUserData(null);
            setIsUserDataLoading(false);
        });

        setIsHistoryLoading(true);
        const historyCollectionRef = doc(db, 'quizHistory', user.uid);
        const unsubscribeHistory = onSnapshot(historyCollectionRef, (doc) => {
          const historyData = doc.data();
          setQuizHistory(historyData?.attempts || []);
          setIsHistoryLoading(false);
        }, (error) => {
            console.error("Error fetching quiz history:", error);
            setQuizHistory([]);
            setIsHistoryLoading(false);
        });

        return () => {
            unsubscribeUser();
            unsubscribeHistory();
        }
    } else {
      // If there's no user, we are not loading user-specific data.
      setIsUserDataLoading(false);
      setIsHistoryLoading(false);
    }
  }, [user]);

  const value = { user, userData, quizHistory, isProfileComplete, loading, isUserDataLoading, isHistoryLoading };

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
