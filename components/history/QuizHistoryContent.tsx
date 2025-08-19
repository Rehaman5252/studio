
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Ban, Calendar, CheckCircle, Clock, Eye, ServerCrash, WifiOff, XCircle } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useRouter } from 'next/navigation';

const HistoryItemSkeleton = () => (
    <Card className="bg-card/80 border-primary/10 shadow-lg">
        <CardHeader>
            <div className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-md mt-1 flex-shrink-0" />
                <div className="flex-grow space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-5/6" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
        </CardContent>
    </Card>
);

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function QuizHistoryContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
            const q = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            const historyData = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
            setQuizHistory(historyData);
        } catch (e: any) {
            console.error("Failed to fetch quiz history:", e);
             if (e.code === 'unavailable' || e.message?.includes('offline')) {
                setError("You appear to be offline. Please check your connection to see your history.");
            } else {
                setError("Could not load your quiz history. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }
    fetchHistory();
  }, [user, authLoading]);
  
  const handleReview = (attempt: QuizAttempt) => {
    const attemptDataString = btoa(JSON.stringify(attempt));
    router.push(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);
  };

  if (isLoading || authLoading) {
    return (
        <div className="space-y-4">
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
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
              <p className="font-semibold text-lg text-foreground">No History Yet!</p>
              <p>Your past quizzes will appear here once you've played a game.</p>
            </CardContent>
        </Card>
    );
  }
  
  return (
      <div className="space-y-4">
        {quizHistory.map((attempt) => {
          const attemptDate = new Date(attempt.timestamp);
          const isPerfectScore = attempt.score === attempt.totalQuestions;
          const isDisqualified = !!attempt.reason;
          return (
          <Card key={attempt.slotId} className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader>
                <div className="flex items-start gap-4">
                     <div className="mt-1 flex-shrink-0">
                        {isDisqualified ? <Ban className="h-8 w-8 text-destructive" />
                        : isPerfectScore ? <Award className="h-8 w-8 text-yellow-500" />
                        : <CheckCircle className="h-8 w-8 text-green-600" />
                        }
                    </div>
                    <div className="flex-grow">
                        <CardTitle className="text-lg">{attempt.format} Quiz ({attempt.brand})</CardTitle>
                        <CardDescription>
                            {isDisqualified ? 'Disqualified (No Ball)' : `Scored ${attempt.score}/${attempt.totalQuestions}`}
                        </CardDescription>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{attemptDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{attemptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleReview(attempt)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Review Quiz
                </Button>
            </CardContent>
          </Card>
        )})}
      </div>
  );
}
