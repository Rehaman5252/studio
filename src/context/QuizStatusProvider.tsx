// src/context/QuizStatusProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebaseClient";
import { useAuth } from "./AuthProvider";

interface QuizStatusContextType {
  hasAttempted: boolean;
  loading: boolean;
}

const QuizStatusContext = createContext<QuizStatusContextType>({
  hasAttempted: false,
  loading: true,
});

export const QuizStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "quizStatus", user.uid);
        const docSnap = await getDoc(docRef);

        setHasAttempted(docSnap.exists());
      } catch (error) {
        console.error("Failed to fetch quiz status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  return (
    <QuizStatusContext.Provider value={{ hasAttempted, loading }}>
      {!loading && children}
    </QuizStatusContext.Provider>
  );
};

export const useQuizStatus = () => {
    const context = useContext(QuizStatusContext);
    if (context === undefined) {
      throw new Error('useQuizStatus must be used within a QuizStatusProvider');
    }
    return context;
};
