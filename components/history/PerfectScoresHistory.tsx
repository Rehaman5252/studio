'use client';

import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';

export default function PerfectScoresHistory() {
  const { user, loading: authLoading } = useAuth();
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
        setIsLoading(false);
        return;
    }
    if (!db) { 
        setError("Database not connected.");
        setIsLoading(false);
        return;
    }

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const attemptsRef = collection(db, "users", user.uid, "quizAttempts");
            // This query requires a composite index on score (==) and timestamp (desc).
            const q = query(
                attemptsRef, 
                where("score", "==", 5),
                orderBy("timestamp", "desc")
            );

            const querySnapshot = await getDocs(q);
            const historyData = querySnapshot.docs
                .map(doc => doc.data() as QuizAttempt)
                .filter(attempt => !attempt.reason); // Ensure disqualified attempts aren't shown

            setQuizHistory(historyData);
        } catch (e: any) {
            console.error("Failed to fetch perfect score history:", e);
             if (e.code === 'unavailable' || e.message?.includes('offline')) {
                setError("You appear to be offline. Please check your connection to see your history.");
            } else if (e.code === 'failed-precondition') {
                setError("The required data is still being indexed. Please check back in a few moments.");
            } else {
                setError("Could not load your quiz history. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }
    fetchHistory();
  }, [user, authLoading]);
  
  if (isLoading || authLoading) {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => <HistoryItemSkeleton key={i} />)}
        </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (quizHistory.length === 0) {
    return (
        <Card className="bg-card/80">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-semibold text-lg text-foreground">No Perfect Scores Yet!</p>
              <p>Keep playing! A perfect 5/5 score will land you here and earn you a certificate.</p>
            </CardContent>
        </Card>
    );
  }
  
  return (
      <div className="space-y-4">
        {quizHistory.map((attempt) => (
          <HistoryItem key={attempt.slotId} attempt={attempt} />
        ))}
      </div>
  );
}
