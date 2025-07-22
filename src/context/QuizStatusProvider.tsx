
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { QuizAttempt } from '@/lib/mockData';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebaseConnection } from './FirebaseConnectionProvider';

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
  const { connected } = useFirebaseConnection();
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [retry, setRetry] = useState(false);

  const isLoading = isAuthLoading || isHistoryLoading;
  
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
    if (!connected) {
        setIsHistoryLoading(true);
        return;
    }
    if (isAuthLoading) return;
    if (!user) {
        setIsHistoryLoading(false);
        setLastAttemptInSlot(null);
        return;
    }
    
    const fetchLastAttempt = async () => {
        setIsHistoryLoading(true);
        setRetry(false);
        try {
            const historyDocRef = doc(db, 'users', user.uid, 'quizAttempts', getQuizSlotId());
            const docSnap = await getDoc(historyDocRef);
            if (docSnap.exists()) {
                setLastAttemptInSlot(docSnap.data() as QuizAttempt);
            } else {
                setLastAttemptInSlot(null);
            }
        } catch (error) {
            console.error("Failed to fetch last quiz attempt:", error);
            setLastAttemptInSlot(null);
            setRetry(true);
        } finally {
            setIsHistoryLoading(false);
        }
    }
    fetchLastAttempt();
  }, [user, isAuthLoading, connected]);

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
    isLoading: isLoading || !connected,
  };

  if (isLoading || !connected) {
      return (
        <div className="flex items-center justify-center h-screen w-screen text-lg font-medium text-muted-foreground">
          {retry ? "⚠️ Could not load data. Retrying..." : "Connecting to server..."}
        </div>
      );
  }

  return <QuizStatusContext.Provider value={value}>{children}</QuizStatusContext.Provider>;
};

export const useQuizStatus = () => {
  const context = useContext(QuizStatusContext);
  if (context === undefined) {
    throw new Error('useQuizStatus must be used within a QuizStatusProvider');
  }
  return context;
};
