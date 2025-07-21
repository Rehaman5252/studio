
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebaseClient';
import { createUserDocument } from '@/lib/authUtils';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  firestoreReady: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: any) => Promise<void>;
  lastAttempt: any | null;
  setLastAttempt: (attempt: any | null) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = getAuth(firebaseApp!);
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    let unsubProfile: Unsubscribe | undefined;
    let unsubFirestore: Unsubscribe | undefined;

    const db = getFirestore(firebaseApp!);

    if (user) {
      const dummyDocRef = doc(db, '__status__/ping');
      unsubFirestore = onSnapshot(dummyDocRef, { includeMetadataChanges: true }, (snapshot) => {
        if (!snapshot.metadata.fromCache) {
          setFirestoreReady(true);
        }
      }, (error) => {
        console.error('Firestore connection error:', error);
        setFirestoreReady(false);
      });

      const userDocRef = doc(db, 'users', user.uid);
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          await createUserDocument(user);
        }
      }, (error) => {
         console.error("Profile listener error:", error);
         setFirestoreReady(false);
      });

    } else {
      setProfile(null);
      setIsProfileComplete(false);
      setFirestoreReady(false);
    }
    
    return () => {
        if (unsubProfile) unsubProfile();
        if (unsubFirestore) unsubFirestore();
    };
  }, [user, authLoading]);

  const value = {
    user,
    profile,
    loading: authLoading || (!firestoreReady && !!user),
    firestoreReady,
    lastAttempt,
    setLastAttempt,
    isProfileComplete
    // updateUserData and addQuizAttempt would be defined here with useCallback
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
