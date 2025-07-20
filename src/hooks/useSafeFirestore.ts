
'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import type { Firestore } from 'firebase/firestore';

export const useSafeFirestore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
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
    firestore: isReady ? getFirebaseFirestore() : null, 
    loading: !isReady, 
    error 
  };
};
