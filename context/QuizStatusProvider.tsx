
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, collection, getCountFromServer, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface QuizStatusContextType {
  timeLeft: { minutes: number; seconds: number };
  playersPlaying: number;
  playersPlayed: number;
  totalWinners: number;
  isLoading: boolean;
}

const QuizStatusContext = createContext<QuizStatusContextType | undefined>(undefined);

export const QuizStatusProvider = ({ children }: { children: ReactNode }) => {
  const { loading: isAuthLoading } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [playersPlaying, setPlayersPlaying] = useState(0);
  const [playersPlayed, setPlayersPlayed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const listenersRef = useRef<Unsubscribe[]>([]);
  
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
    if (!db) {
        setIsLoading(false);
        return;
    }
    
    let isMounted = true;
    setIsLoading(true);

    // Global stats listener
    const statsDocRef = doc(db, 'globals', 'stats');
    const unsubscribeStats = onSnapshot(statsDocRef, (doc) => {
        if (!isMounted) return;
        if (doc.exists()) {
            const data = doc.data();
            setPlayersPlayed(data.totalQuizzesPlayed || 0);
            setTotalWinners(data.totalPerfectScores || 0);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to listen to global stats:", error);
        if (isMounted) setIsLoading(false);
    });
    listenersRef.current.push(unsubscribeStats);

    // Live player count
    const fetchLivePlayers = async () => {
        if (!isMounted || !db) return;
        try {
            const currentSlotId = getQuizSlotId();
            const liveEntriesRef = collection(db, 'leaderboard_live', currentSlotId, 'entries');
            const snapshot = await getCountFromServer(liveEntriesRef);
            if (isMounted) setPlayersPlaying(snapshot.data().count);
        } catch (error) {
            console.warn("Could not fetch live player count:", error);
        }
    };
    
    fetchLivePlayers();
    const interval = setInterval(fetchLivePlayers, 15000); 

    return () => {
        isMounted = false;
        clearInterval(interval);
        listenersRef.current.forEach(unsub => unsub());
        listenersRef.current = [];
    };
  }, []);

  const value = {
    timeLeft,
    playersPlaying,
    playersPlayed,
    totalWinners,
    isLoading: isLoading || isAuthLoading,
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
