
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { DocumentData } from 'firebase/firestore';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!auth) { 
      console.error("Firebase Auth not initialized.");
      setLoading(false); 
      return; 
    }
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { 
      setProfile(null); 
      setLoading(false); 
      return; 
    }
    setLoading(true);
    (async () => {
      try {
        const db = getFirebaseFirestore();
        if (!db) throw new Error("Firestore not initialized");

        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) { 
          setLoading(false); 
          return; 
        }

        const ref = doc(db, "users", user.uid);
        const userDoc = await getDoc(ref);

        if (!userDoc.exists()) {
          await createUserDocument(user);
          // After creation, we can either refetch or set profile to null/empty.
          // Setting to null is fine as it indicates profile needs completion.
          setProfile(null); 
        } else {
          const data = userDoc.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split("T")[0];
          }
          setProfile(data);
        }
      } catch (e) { 
        console.error("Error fetching user profile:", e);
        setIsOffline(true); 
        setProfile(null); 
      }
      setLoading(false);
    })();
  }, [user]);

  // Optimistic profile update and creation
  const updateUserData = useCallback(async (newData: Partial<any>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User or DB not available");
    
    // Optimistic update for immediate UI feedback
    setProfile(prev => ({ ...prev, ...newData }));

    try {
      await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(newData), { merge: true });
    } catch (error) {
      console.error("Failed to update user data:", error);
      // Optional: Add logic to revert the optimistic update and show a toast.
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

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
