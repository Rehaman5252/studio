
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

/**
 * A hook to determine if Firebase Auth has been initialized and checked the user's status.
 * @returns `true` once Firebase has loaded and the initial auth state is known, `false` otherwise.
 */
export function useFirebaseReady() {
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // If auth isn't initialized (e.g., on the server), we can't proceed.
    if (!auth) {
      return;
    }
    
    // onAuthStateChanged fires once on initial load with the user's current state (or null).
    // We can use this as a reliable signal that Firebase Auth is ready.
    const unsubscribe = onAuthStateChanged(auth, () => {
      setFirebaseReady(true);
      unsubscribe(); // We only need this for the initial readiness check.
    });

    return () => unsubscribe();
  }, []);

  return firebaseReady;
}
