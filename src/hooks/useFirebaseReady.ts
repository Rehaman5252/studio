// src/hooks/useFirebaseReady.ts
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function useFirebaseReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsReady(true); // Once auth state is known (user or null), Firebase is ready.
      unsubscribe(); // We only need this to fire once.
    });

    return () => unsubscribe();
  }, []);

  return isReady;
}
