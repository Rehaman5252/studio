
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';

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

  useEffect(() => {
    const calculateTimeLeft = () => {
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

      // Reset last attempt if the slot has changed
      const currentSlotId = getQuizSlotId();
      if (lastAttemptInSlot?.slotId !== currentSlotId) {
        setLastAttemptInSlot(null);
      }
    };
    
    // Extracted to be used by the effect hook
    const getQuizSlotId = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const currentSlotStartMinute = Math.floor(minutes / 10) * 10;
        const slotTime = new Date(now);
        slotTime.setMinutes(currentSlotStartMinute, 0, 0);
        return slotTime.getTime().toString();
    };


    calculateTimeLeft();
    const timerInterval = setInterval(calculateTimeLeft, 1000);

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
  }, [lastAttemptInSlot?.slotId]);
  
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
