
// src/hooks/useFirebaseReady.ts
import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebaseClient";

export default function useFirebaseReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && isFirebaseConfigured) {
      setReady(true);
    }
  }, []);

  return ready;
}
