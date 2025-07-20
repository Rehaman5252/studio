
'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebaseClient';
import type { Firestore } from 'firebase/firestore';

export const useSafeFirestore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      // Firebase might not be initialized yet (e.g. server-side)
      // or config is missing.
      setIsReady(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsReady(true);
    }, (err) => {
      setError(err);
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    firestore: isReady && user ? firestore : null, 
    loading: !isReady, 
    error 
  };
};
