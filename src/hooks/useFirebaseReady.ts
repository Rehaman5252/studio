'use client';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function useFirebaseReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function. When it first fires
    // (with either a user or null), we know Firebase Auth is initialized.
    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsReady(true);
      unsubscribe(); // We only need this to fire once to know it's ready.
    });

    return () => unsubscribe();
  }, []);

  return isReady;
}
