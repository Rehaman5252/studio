'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { DocumentData } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<DocumentData>) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const db = getFirebaseFirestore();
        if (!db) throw new Error("Firestore not initialized");
        const online = await isFirebaseOnline();
        setIsOffline(!online);
        if (!online) { setLoading(false); return; }
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split("T")[0];
          }
          setProfile(data);
        } else {
          // If the doc doesn't exist, it will be created on the first updateUserData call,
          // for now, we set profile to null to indicate it needs creation/completion.
          setProfile(null); 
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
  const updateUserData = useCallback(async (data: Partial<DocumentData>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User or DB not available");
    setProfile(prev => ({ ...prev, ...data }));
    await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(data), { merge: true });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isOffline, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
