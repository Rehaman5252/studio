
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';

export function useFirebaseReady() {
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        setFirebaseReady(false);
        return;
    }
    // onAuthStateChanged is the most reliable way to know when Firebase auth is initialized.
    // It fires once on load (with user or null), which we can use as our "ready" signal.
    const unsubscribe = onAuthStateChanged(auth, () => {
      setFirebaseReady(true);
      unsubscribe(); // Unsubscribe after the first check to avoid memory leaks.
    });

    return () => unsubscribe();
  }, []);

  return firebaseReady;
}
