
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { getQuizSlotId } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import type { QuizQuestion } from '@/ai/schemas';

// Represents a simplified quiz attempt for tracking in the current session.
export interface SlotAttempt {
  slotId: string;
  score: number;
  totalQuestions: number;
  format: string;
  brand: string;
  // New fields to store full context for review
  questions: QuizQuestion[];
  userAnswers: string[];
  timePerQuestion?: number[];
  usedHintIndices?: number[];
  timestamp?: number;
}

interface QuizStatus {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
  lastAttemptInSlot: SlotAttempt | null;
  setLastAttemptInSlot: (attempt: SlotAttempt | null) => void;
  isLoading: boolean; // Add a loading state for checking local storage
}

const QuizStatusContext = createContext<QuizStatus | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get the current user
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [playersPlaying, setPlayersPlaying] = useState(743);
  const [playersPlayed, setPlayersPlayed] = useState(3029);
  const [totalWinners, setTotalWinners] = useState(129);
  const [lastAttemptInSlot, _setLastAttemptInSlot] = useState<SlotAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  const getLocalStorageKey = useCallback(() => {
    if (!user) return null;
    return `indcric_last_attempt_${user.uid}`;
  }, [user]);

  // This function will be exposed to consumers to set the attempt.
  // It updates both state and localStorage.
  const setLastAttemptInSlot = useCallback((attempt: SlotAttempt | null) => {
    // This function can be called from client components that might not have access to window immediately.
    if (typeof window === 'undefined') return;
    const key = getLocalStorageKey();
    if (!key) return;

    _setLastAttemptInSlot(attempt); // Update React state
    if (attempt) {
      localStorage.setItem(key, JSON.stringify(attempt));
    } else {
      localStorage.removeItem(key);
    }
  }, [getLocalStorageKey]);

  // Effect to initialize state from localStorage on mount and when user changes
  useEffect(() => {
    if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
    };

    const key = getLocalStorageKey();
    if (!key) {
      _setLastAttemptInSlot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const storedAttemptRaw = localStorage.getItem(key);
      if (storedAttemptRaw) {
        const storedAttempt: SlotAttempt = JSON.parse(storedAttemptRaw);
        const currentSlotId = getQuizSlotId();
        // If the stored attempt is for the current slot, load it into state
        if (storedAttempt.slotId === currentSlotId) {
          _setLastAttemptInSlot(storedAttempt);
        } else {
          // If the slot has expired, clear the old attempt from storage
          localStorage.removeItem(key);
           _setLastAttemptInSlot(null);
        }
      } else {
        _setLastAttemptInSlot(null);
      }
    } catch (error) {
      console.error("Failed to parse last attempt from localStorage", error);
      // Clear potentially corrupt data
      const lsKey = getLocalStorageKey();
      if(lsKey) localStorage.removeItem(lsKey);
    } finally {
      setIsLoading(false);
    }
  }, [getLocalStorageKey]);


  useEffect(() => {
    // This interval handles two things:
    // 1. Updates the countdown timer.
    // 2. Clears the lock if a new slot starts while the app is open.
    const timerInterval = setInterval(() => {
      const currentSlotId = getQuizSlotId();
      
      // Check if the current attempt in state is from a previous slot
      if (lastAttemptInSlot && lastAttemptInSlot.slotId !== currentSlotId) {
        setLastAttemptInSlot(null); // This will clear state and localStorage
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

    // This interval just updates the dummy player stats
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
  }, [lastAttemptInSlot, setLastAttemptInSlot]); // Rerun if attempt changes

  const value = useMemo(() => ({
    timeLeft, 
    playersPlaying, 
    playersPlayed, 
    totalWinners,
    lastAttemptInSlot,
    setLastAttemptInSlot,
    isLoading
  }), [timeLeft, playersPlaying, playersPlayed, totalWinners, lastAttemptInSlot, setLastAttemptInSlot, isLoading]);

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
