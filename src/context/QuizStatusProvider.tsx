
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useRef } from 'react';
import { getQuizSlotId } from '@/lib/utils';

// Represents a simplified quiz attempt for tracking in the current session.
export interface SlotAttempt {
  slotId: string;
  score: number;
  totalQuestions: number;
  format: string;
  brand: string;
}

interface QuizStatus {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
  lastAttemptInSlot: SlotAttempt | null;
  setLastAttemptInSlot: (attempt: SlotAttempt | null) => void;
}

const QuizStatusContext = createContext<QuizStatus | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [playersPlaying, setPlayersPlaying] = useState(743);
  const [playersPlayed, setPlayersPlayed] = useState(3029);
  const [totalWinners, setTotalWinners] = useState(129);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<SlotAttempt | null>(null);
  
  // Use a ref to hold the latest value of lastAttemptInSlot to avoid stale closures in setInterval
  const lastAttemptRef = useRef(lastAttemptInSlot);
  lastAttemptRef.current = lastAttemptInSlot;

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const currentSlotId = getQuizSlotId();
      const lastAttempt = lastAttemptRef.current;
      
      // If there's an old attempt from a previous slot, clear it.
      if (lastAttempt && lastAttempt.slotId !== currentSlotId) {
        setLastAttemptInSlot(null);
      }

      // Calculate time left in the current slot
      const now = new Date();
      const minutes = now.getMinutes();
      const slotLength = 10;
      const currentSlotStartMinute = Math.floor(minutes / slotLength) * slotLength;
      const nextSlotTime = new Date(now);
      nextSlotTime.setMinutes(currentSlotStartMinute + slotLength, 0, 0);
      const diff = nextSlotTime.getTime() - now.getTime();
      const mins = Math.max(0, Math.floor(diff / 60000));
      const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
      setTimeLeft({ minutes: mins, seconds: secs });
    }, 1000);

    const playerInterval = setInterval(() => {
      setPlayersPlaying((prev) => Math.max(200, prev + Math.floor(Math.random() * 15) - 7));
      setPlayersPlayed((prev) => prev + Math.floor(Math.random() * 8));
      if (Math.random() > 0.7) {
        setTotalWinners((prev) => prev + Math.floor(Math.random() * 3));
      }
    }, 2000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(playerInterval);
    };
  }, []); // Empty dependency array ensures intervals are set up only once

  const value = useMemo(() => ({
    timeLeft, 
    playersPlaying, 
    playersPlayed, 
    totalWinners,
    lastAttemptInSlot,
    setLastAttemptInSlot
  }), [timeLeft, playersPlaying, playersPlayed, totalWinners, lastAttemptInSlot]);

  return (
    <QuizStatusContext.Provider value={value}>
      {children}
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
