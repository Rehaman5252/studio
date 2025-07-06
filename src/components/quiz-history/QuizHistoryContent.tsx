'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Clock, MessageSquareQuote, Sparkles } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { mockQuizHistory } from '@/lib/mockData';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthProvider';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

const CACHE_KEY = 'quizHistoryCache';

const AnalysisDialog = ({ attempt }: { attempt: QuizAttempt }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalysisCacheKey = useCallback(() => `analysis_${attempt.slotId}`, [attempt.slotId]);

    const handleFetchAnalysis = useCallback(async () => {
        const cachedAnalysis = localStorage.getItem(getAnalysisCacheKey());
        if (cachedAnalysis) {
            setAnalysis(cachedAnalysis);
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({
                questions: attempt.questions,
                userAnswers: attempt.userAnswers,
                timePerQuestion: attempt.timePerQuestion,
                usedHintIndices: attempt.usedHintIndices,
            });
            if (!result.analysis) {
                throw new Error("Received empty analysis from the server.");
            }
            setAnalysis(result.analysis);
            localStorage.setItem(getAnalysisCacheKey(), result.analysis);
        } catch (err) {
            console.error("Analysis generation failed:", err);
            setError('Could not generate the analysis. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, attempt, getAnalysisCacheKey]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (open && !analysis) {
            handleFetchAnalysis();
        }
    }, [analysis, handleFetchAnalysis]);

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    View Analysis
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card/90 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle>Quiz Performance Analysis</DialogTitle>
                    <DialogDescription>
                        AI-powered feedback on your {attempt.format} quiz from {new Date(attempt.timestamp).toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm max-h-[60vh] overflow-y-auto pr-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4 text-muted-foreground">Generating your personalized report...</p>
                            <p className="text-xs text-muted-foreground">This can take up to 30 seconds.</p>
                        </div>
                    )}
                    {error && <p className="text-destructive font-semibold p-4 text-center">{error}</p>}
                    {analysis && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:text-md [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-2">
                           <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const getSlotTimings = (timestamp: number) => {
    const attemptDate = new Date(timestamp);
    const minutes = attemptDate.getMinutes();
    const slotStartMinute = Math.floor(minutes / 10) * 10;
    
    const slotStartTime = new Date(attemptDate);
    slotStartTime.setMinutes(slotStartMinute, 0, 0);
    
    const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
};

const QuizHistoryItem = memo(({ attempt }: { attempt: QuizAttempt }) => (
    <div>
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader>
            <CardTitle className="flex justify-between items-center text-lg">
                <span>{attempt.format} Quiz</span>
                <span className="text-lg font-bold text-primary">{attempt.score}/{attempt.totalQuestions}</span>
            </CardTitle>
            <CardDescription className="text-xs">
                Sponsored by {attempt.brand}
            </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(attempt.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">{getSlotTimings(attempt.timestamp)}</span>
                </div>
                </div>
            <AnalysisDialog attempt={attempt} />
            </CardContent>
        </Card>
    </div>
));
QuizHistoryItem.displayName = "QuizHistoryItem";

export default function QuizHistoryContent() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizAttempt[]>(() => {
      if (typeof sessionStorage === 'undefined') return [];
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });
  const [filter, setFilter] = useState<'all' | 'recent' | 'perfect'>('all');
  const [isLoading, setIsLoading] = useState(history.length === 0);

  useEffect(() => {
    async function fetchHistory() {
      if (history.length === 0) {
          setIsLoading(true);
      }

      if (!isFirebaseConfigured || !db || !user) {
        setHistory(mockQuizHistory);
        setIsLoading(false);
        return;
      }
      try {
        const historyCollection = collection(db, 'users', user.uid, 'quizHistory');
        const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(25));
        const querySnapshot = await getDocs(q);
        const fetchedHistory = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
        setHistory(fetchedHistory);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(fetchedHistory));
        }
      } catch (error) {
         console.error("Failed to fetch quiz history:", error);
         if (history.length === 0) {
            setHistory(mockQuizHistory);
         }
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredHistory = useMemo(() => {
    if (filter === 'recent') {
      const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      return history.filter(attempt => attempt.timestamp >= sevenDaysAgo);
    }
    if (filter === 'perfect') {
      return history.filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0);
    }
    return history;
  }, [history, filter]);

  if (isLoading && history.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
        <div className="flex justify-center">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="perfect">Perfect Scores</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        
        {filteredHistory.length > 0 ? (
          <div className="space-y-4 pt-4">
            {filteredHistory.map((attempt) => (
              <QuizHistoryItem key={attempt.slotId} attempt={attempt} />
            ))}
          </div>
        ) : (
          <div>
            <Card className="bg-card/80 mt-4">
              <CardContent className="p-6 text-center text-muted-foreground">
                <MessageSquareQuote className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                <p className="font-semibold">No Quizzes Found</p>
                <p>Play a quiz to see your history here!</p>
              </CardContent>
            </Card>
          </div>
        )}
    </>
  );
}
