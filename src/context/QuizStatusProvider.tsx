
'use client';
/**
 * @fileOverview QuizStatusProvider
 *
 * This provider manages global, non-user-specific state related to the quiz system.
 * It is responsible for:
 *
 * 1.  **Quiz Timer**: Calculating the time remaining in the current 10-minute quiz slot.
 * 2.  **Global Stats**: Simulating live stats like players playing, total winners, etc.
 *     In a real production app, this data would come from a backend or an aggregated
 *     Firestore document.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { getQuizSlotId } from '@/lib/utils';

interface QuizStatusContextType {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
}

const QuizStatusContext = createContext<QuizStatusContextType | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);

  // Calculates the time remaining in the current 10-minute quiz slot.
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

  // Set up an interval to update the timer every second.
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Set up an interval to simulate live player statistics.
  useEffect(() => {
    // Set initial random stats on mount
    setPlayersPlaying(Math.floor(Math.random() * (1500 - 800 + 1)) + 800);
    setPlayersPlayed(Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000);
    setTotalWinners(Math.floor(Math.random() * (500 - 200 + 1)) + 200);

    // Update stats periodically to give a "live" feel.
    const playersTimer = setInterval(() => {
      setPlayersPlaying(p => Math.max(800, p + Math.floor(Math.random() * 21) - 10));
      setPlayersPlayed(p => p + Math.floor(Math.random() * 5));
    }, 3000);

    return () => clearInterval(playersTimer);
  }, []);

  const value = useMemo(() => ({
    timeLeft,
    playersPlaying,
    playersPlayed,
    totalWinners,
  }), [timeLeft, playersPlaying, playersPlayed, totalWinners]);

  return <QuizStatusContext.Provider value={value}>{children}</QuizStatusContext.Provider>;
};

/**
 * Custom hook to easily access the QuizStatusContext.
 */
export const useQuizStatus = () => {
  const context = useContext(QuizStatusContext);
  if (context === undefined) {
    throw new Error('useQuizStatus must be used within a QuizStatusProvider');
  }
  return context;
};
