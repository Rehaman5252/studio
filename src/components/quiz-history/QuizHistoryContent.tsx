
'use client';

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Clock, MessageSquareQuote, Sparkles, AlertTriangle, WifiOff, ServerCrash } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

const AnalysisDialog = ({ attempt }: { attempt: QuizAttempt }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalysisCacheKey = useCallback(() => `analysis_${attempt.format}_${attempt.slotId}`, [attempt.slotId, attempt.format]);

    const handleFetchAnalysis = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const cachedAnalysis = localStorage.getItem(getAnalysisCacheKey());
        if (cachedAnalysis) {
            setAnalysis(cachedAnalysis);
            return;
        }

        if (isLoading || !attempt.questions || !attempt.userAnswers) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await generateQuizAnalysis({
                questions: attempt.questions,
                userAnswers: attempt.userAnswers,
                format: attempt.format,
                timePerQuestion: attempt.timePerQuestion,
                usedHintIndices: attempt.usedHintIndices,
            });
            if (!result.analysis) {
                throw new Error("Received empty analysis from the server.");
            }
            setAnalysis(result.analysis);
            localStorage.setItem(getAnalysisCacheKey(), result.analysis);
        } catch (err: any) {
            console.error("Analysis generation failed:", err);
            if (err.message?.includes('offline')) {
                setError("You are offline. Please reconnect to generate AI analysis.");
            } else {
                setError('Could not generate the analysis. Please try again later.');
            }
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
                <Button variant="secondary" size="sm" disabled={!!attempt.reason}>
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

const QuizHistoryItem = memo(({ attempt }: { attempt: QuizAttempt }) => {
    const isMalpractice = attempt.reason === 'malpractice';

    return (
        <div>
            <Card className={cn(
                "bg-card/80 border-primary/10 shadow-lg",
                isMalpractice && "bg-destructive/10 border-destructive/20"
            )}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span>{attempt.format} Quiz</span>
                        <span className={cn(
                            "text-lg font-bold text-primary",
                            isMalpractice && "text-destructive"
                        )}>
                            {isMalpractice ? 'Disqualified' : `${attempt.score}/${attempt.totalQuestions}`}
                        </span>
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
                         {isMalpractice && (
                            <div className="flex items-center gap-2 text-destructive pt-1">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-semibold">Malpractice Detected</span>
                            </div>
                        )}
                    </div>
                <AnalysisDialog attempt={attempt} />
                </CardContent>
            </Card>
        </div>
    );
});
QuizHistoryItem.displayName = "QuizHistoryItem";

const HistorySkeleton = () => (
    <div className="space-y-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card/80 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </CardContent>
            </Card>
        ))}
    </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <div className="pt-4">
        <Alert variant="destructive">
            {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
            <AlertTitle>Error Loading History</AlertTitle>
            <AlertDescription>{message || "Could not connect to the database."}</AlertDescription>
        </Alert>
    </div>
);

export default function QuizHistoryContent() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'perfect'>('all');
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for auth state to be resolved
    if (!user || !db) {
      setIsFetching(false);
      return;
    }
    
    const fetchHistory = async () => {
        setIsFetching(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'users', user.uid, 'quizAttempts'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
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
            setIsFetching(false);
        }
    }
    fetchHistory();
  }, [user, loading]);

  const filteredHistory = useMemo(() => {
    if (filter === 'perfect') {
      return quizHistory.filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0 && !attempt.reason);
    }
    return quizHistory;
  }, [quizHistory, filter]);

  const renderContent = () => {
    if (isFetching) {
        return <HistorySkeleton />;
    }
    if (error) {
        return <ErrorState message={error} />;
    }
    if (filteredHistory.length > 0) {
        return (
            <div className="space-y-4 pt-4">
                {filteredHistory.map((attempt) => (
                    <QuizHistoryItem key={`${attempt.slotId}-${attempt.format}-${attempt.timestamp}`} attempt={attempt} />
                ))}
            </div>
        );
    }
    return (
        <div>
            <Card className="bg-card/80 mt-4">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <MessageSquareQuote className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                    <p className="font-semibold text-lg">No Quizzes Found</p>
                    <p>Play a quiz to see your history here!</p>
                </CardContent>
            </Card>
        </div>
    );
  };

  return (
    <>
        <div className="flex justify-center">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="perfect">Perfect Scores</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        
        {renderContent()}
    </>
  );
}
