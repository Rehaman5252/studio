'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

export function useFirebaseReady() {
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Firebase is only available on the client, so if auth is not defined,
    // we are on the server and should not proceed.
    if (!auth) {
      return;
    }
    
    // onAuthStateChanged returns the user (or null) when the initial check is complete.
    // This is the most reliable way to know when Firebase Auth is ready to be used.
    const unsubscribe = onAuthStateChanged(auth, () => {
      setFirebaseReady(true);
      unsubscribe(); // We only need this initial check, not subsequent auth changes.
    });

    // Cleanup the subscription if the component unmounts before Firebase is ready.
    return () => unsubscribe();
  }, []);

  return firebaseReady;
}
