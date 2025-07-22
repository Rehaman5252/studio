
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { QuizAttempt } from '@/lib/mockData';
import { db } from '@/lib/firebaseClient';
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
  const { user, loading: authLoading } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !db) {
        setIsLoading(false);
        setLastAttemptInSlot(null);
        return;
    }
    
    const fetchLastAttempt = async () => {
        setIsLoading(true);
        try {
            const slotId = getQuizSlotId();
            const historyDocRef = doc(db, 'users', user.uid, 'quizAttempts', slotId);
            const docSnap = await getDoc(historyDocRef);
            if (docSnap.exists()) {
                setLastAttemptInSlot(docSnap.data() as QuizAttempt);
            } else {
                setLastAttemptInSlot(null);
            }
        } catch (error) {
            console.error("Failed to fetch last quiz attempt:", error);
            setLastAttemptInSlot(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchLastAttempt();
  }, [user, authLoading]);
  
  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const slotLength = 10;
        const remainingMinutes = slotLength - (minutes % slotLength) - 1;
        const remainingSeconds = 59 - seconds;
        setTimeLeft({ minutes: remainingMinutes, seconds: remainingSeconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setPlayersPlaying(Math.floor(Math.random() * (1500 - 800 + 1)) + 800);
    setPlayersPlayed(Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000);
    setTotalWinners(Math.floor(Math.random() * (500 - 200 + 1)) + 200);
  }, []);

  return (
    <QuizStatusContext.Provider value={{ timeLeft, playersPlaying, playersPlayed, totalWinners, lastAttemptInSlot, isLoading: authLoading || isLoading }}>
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
