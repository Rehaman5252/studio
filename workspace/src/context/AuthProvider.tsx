
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { DocumentData } from 'firebase/firestore';
import { doc, setDoc, Timestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, db, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (newData: Partial<any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return !navigator.onLine;
    return false; // assume online during SSR
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const userDocRef = doc(db, 'users', user.uid);

    const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data || null);
      } else {
        await createUserDocument(user);
        // The snapshot will re-trigger with the new document, setting profile then
      }
      setLoading(false);
    }, (error) => {
        console.error("Profile snapshot error:", error);
        setLoading(false);
    });
    
    return () => {
      unsubProfile();
    }
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<any>) => {
    if (!user || !db) throw new Error("User/DB not available");
    // Optimistic update for immediate UI feedback
    setProfile(prev => ({ ...prev, ...newData }));
    try {
        await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(newData), { merge: true });
    } catch (error) {
        console.error("Failed to update user data:", error);
        // Here you could add logic to revert the optimistic update if needed
        // and show a toast message to the user.
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isOffline,
    updateUserData,
  }), [user, profile, loading, isOffline, updateUserData]);

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
