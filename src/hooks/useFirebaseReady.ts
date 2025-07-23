// src/hooks/useFirebaseReady.ts
'use client';
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function useFirebaseReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsReady(true);
      unsubscribe(); // We only need to know about the first state change
    });

    return () => unsubscribe();
  }, []);

  return isReady;
}
