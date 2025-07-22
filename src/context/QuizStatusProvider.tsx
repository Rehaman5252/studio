
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
 * 3.  **Last Attempt Fetching**: It now correctly waits for the user to be authenticated
 *     before trying to fetch their last quiz attempt for the current slot. This resolves
 *     the "client is offline" race condition.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { QuizAttempt } from '@/lib/mockData';
import { getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

interface QuizStatusContextType {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
  lastAttemptInSlot: QuizAttempt | null;
  isLoading: boolean;
}

const QuizStatusContext = createContext<QuizStatusContextType | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: isAuthLoading } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // The overall loading state depends on both auth and this provider's history fetch.
  const isLoading = isAuthLoading || isHistoryLoading;

  // This effect correctly waits for the user object to be available before fetching data.
  useEffect(() => {
    // If the main auth provider is still loading, wait.
    if (isAuthLoading) {
      return;
    }
    
    // If there is no authenticated user, we can stop loading and clear any previous attempt data.
    if (!user) {
        setIsHistoryLoading(false);
        setLastAttemptInSlot(null);
        return;
    }
    
    // Define the async function to fetch the data.
    const fetchLastAttempt = async () => {
        const online = await isFirebaseOnline();
        if (!online) {
            console.warn("Client is offline, skipping fetch for last attempt.");
            setIsHistoryLoading(false);
            return;
        }

        const db = getFirebaseFirestore();
        if (!db) {
            console.error("Firestore not initialized, cannot fetch last attempt.");
            setIsHistoryLoading(false);
            return;
        }
        
        setIsHistoryLoading(true);
        try {
            const historyDocRef = doc(db, 'users', user.uid, 'quizAttempts', getQuizSlotId());
            const docSnap = await getDoc(historyDocRef);
            setLastAttemptInSlot(docSnap.exists() ? docSnap.data() as QuizAttempt : null);
        } catch (error) {
            console.error("Failed to fetch last quiz attempt:", error);
            setLastAttemptInSlot(null);
        } finally {
            setIsHistoryLoading(false);
        }
    }
    
    // Execute the fetch function.
    fetchLastAttempt();

  }, [user, isAuthLoading]);
  
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
    setPlayersPlaying(Math.floor(Math.random() * (1500 - 800 + 1)) + 800);
    setPlayersPlayed(Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000);
    setTotalWinners(Math.floor(Math.random() * (500 - 200 + 1)) + 200);
    const playersTimer = setInterval(() => {
      setPlayersPlaying(p => Math.max(800, p + Math.floor(Math.random() * 21) - 10));
      setPlayersPlayed(p => p + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(playersTimer);
  }, []);

  const value = {
    timeLeft,
    playersPlaying,
    playersPlayed,
    totalWinners,
    lastAttemptInSlot,
    isLoading,
  };

  return <QuizStatusContext.Provider value={value}>{children}</QuizStatusContext.Provider>;
};

export const useQuizStatus = () => {
  const context = useContext(QuizStatusContext);
  if (context === undefined) {
    throw new Error('useQuizStatus must be used within a QuizStatusProvider');
  }
  return context;
};
