
'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import type { Firestore } from 'firebase/firestore';

export const useSafeFirestore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        // This case can happen during SSR or if Firebase fails to initialize.
        setLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // We only set the firestore instance once we have a user state determined.
      setFirestore(getFirebaseFirestore());
      setLoading(false);
    }, (err) => {
      console.error("Auth state error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    firestore, 
    loading, 
    error 
  };
};
