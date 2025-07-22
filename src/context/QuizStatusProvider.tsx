
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "./AuthProvider";
import { getQuizSlotId } from "@/lib/utils";
import type { QuizAttempt } from "@/lib/mockData";

interface QuizStatusContextType {
  lastAttemptInSlot: QuizAttempt | null;
  isLoading: boolean;
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
}

const QuizStatusContext = createContext<QuizStatusContextType | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setLastAttemptInSlot(null);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const slotId = getQuizSlotId();
        const docRef = doc(db, `users/${user.uid}/quizAttempts`, slotId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setLastAttemptInSlot(snapshot.data() as QuizAttempt);
        } else {
          setLastAttemptInSlot(null);
        }
      } catch (error) {
        console.error("❌ Firestore fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, authLoading]);
  
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const slotLength = 10;
    const slotEndMinute = (Math.floor(minutes / slotLength) + 1) * slotLength;
    const endTime = new Date(now);
    endTime.setMinutes(slotEndMinute, 0, 0);
    const diff = endTime.getTime() - now.getTime();
    const minutesLeft = Math.max(0, Math.floor((diff / 1000 / 60) % 60));
    const secondsLeft = Math.max(0, Math.floor((diff / 1000) % 60));
    return { minutes: minutesLeft, seconds: secondsLeft };
  }, []);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);
  
  useEffect(() => {
    // Mocked stats
    setPlayersPlaying(Math.floor(Math.random() * (1500 - 800 + 1)) + 800);
    setPlayersPlayed(Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000);
    setTotalWinners(Math.floor(Math.random() * (500 - 200 + 1)) + 200);
  }, []);

  return (
    <QuizStatusContext.Provider
      value={{
        lastAttemptInSlot,
        isLoading: authLoading || loading,
        timeLeft,
        playersPlaying,
        playersPlayed,
        totalWinners,
      }}
    >
      {children}
    </QuizStatusContext.Provider>
  );
};

export const useQuizStatus = () => {
    const context = useContext(QuizStatusContext);
    if (context === undefined) {
        throw new Error("useQuizStatus must be used within a QuizStatusProvider");
    }
    return context;
};
