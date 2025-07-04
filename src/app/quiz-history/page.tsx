
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Clock, MessageSquareQuote } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { mockQuizHistory } from '@/lib/mockData';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';
import useRequireAuth from '@/hooks/useRequireAuth';


const AnalysisDialog = ({ attempt }: { attempt: QuizAttempt }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchAnalysis = useCallback(async () => {
        if (analysis || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({
                questions: attempt.questions,
                userAnswers: attempt.userAnswers,
            });
            setAnalysis(result.analysis);
        } catch (err) {
            console.error(err);
            setError('Could not generate the analysis. This feature may require API keys to be configured. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [analysis, isLoading, attempt]);

    return (
        <Dialog onOpenChange={(open) => {
            if (open) handleFetchAnalysis();
        }}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">View Analysis</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-background/90 backdrop-blur-sm">
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
                    {error && <p className="text-destructive font-semibold">{error}</p>}
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


export default function QuizHistoryPage() {
  useRequireAuth();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'perfect'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        setHistory(mockQuizHistory);
        setIsLoading(false);
    }, 500);
  }, []);

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

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80 pb-20">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80">
      <header className="p-4 bg-background/70 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
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
          <div className="space-y-4">
            {filteredHistory.map((attempt) => (
              <Card key={attempt.slotId + attempt.format} className="bg-background/70 backdrop-blur-sm border-white/20 shadow-lg">
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
            ))}
          </div>
        ) : (
          <Card className="bg-background/70 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center text-muted-foreground">
              <MessageSquareQuote className="h-12 w-12 mx-auto text-primary/50 mb-4" />
              <p className="font-semibold">No Quizzes Found</p>
              <p>Play a quiz to see your history here!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
