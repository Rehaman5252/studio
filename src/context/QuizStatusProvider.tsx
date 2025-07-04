'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface QuizStatus {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
}

const QuizStatusContext = createContext<QuizStatus | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [playersPlaying, setPlayersPlaying] = useState(743);
  const [playersPlayed, setPlayersPlayed] = useState(3029);
  const [totalWinners, setTotalWinners] = useState(129);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      
      const slotLength = 10;
      const currentSlotStartMinute = Math.floor(minutes / slotLength) * slotLength;
      const nextSlotStartMinute = currentSlotStartMinute + slotLength;
      
      const nextSlotTime = new Date(now);
      nextSlotTime.setMinutes(nextSlotStartMinute, 0, 0);
      
      const diff = nextSlotTime.getTime() - now.getTime();
      
      const mins = Math.max(0, Math.floor(diff / 60000));
      const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
      
      setTimeLeft({ minutes: mins, seconds: secs });
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
  }, []);
  
  const value = { timeLeft, playersPlaying, playersPlayed, totalWinners };

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
