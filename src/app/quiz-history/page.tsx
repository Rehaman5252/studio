'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestion } from '@/ai/schemas';
import { CheckCircle, Trophy, BarChart, History, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';

interface QuizAttempt {
  slotId: string;
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: string[];
  timestamp: number;
}

export default function QuizHistoryPage() {
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'perfect'>('recent');
  const [isClient, setIsClient] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedHistory = localStorage.getItem('cricblitz-quiz-history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse quiz history from localStorage", e);
        setHistory([]);
      }
    }
  }, []);

  const handleAnalysisClick = async (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setIsAnalysisOpen(true);
    if (!analysisResult) {
        setIsGenerating(true);
        try {
            const result = await generateQuizAnalysis({
                questions: attempt.questions,
                userAnswers: attempt.userAnswers,
            });
            setAnalysisResult(result.analysis);
        } catch (error) {
            console.error("Failed to generate analysis:", error);
            setAnalysisResult("Sorry, we couldn't generate an analysis for this quiz. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
        setIsAnalysisOpen(false);
        setAnalysisResult(null);
        setSelectedAttempt(null);
    }
  }

  const filteredHistory = history.filter(attempt => {
    if (filter === 'perfect') return attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0;
    if (filter === 'recent') return true; 
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  if (!isClient) {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-white"/>
        </div>
    );
  }
  
  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20">
        <header className="p-4 bg-background/50 backdrop-blur-lg sticky top-0 z-10 border-b">
          <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex justify-center gap-2">
              <Button onClick={() => setFilter('recent')} variant={filter === 'recent' ? 'default' : 'secondary'}><History className="mr-2"/>Recent</Button>
              <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'default' : 'secondary'}><BarChart className="mr-2"/>All</Button>
              <Button onClick={() => setFilter('perfect')} variant={filter === 'perfect' ? 'default' : 'secondary'}><Trophy className="mr-2"/>Perfect Scores</Button>
          </div>
          
          {filteredHistory.length > 0 ? (
              <div className="space-y-4">
                  {filteredHistory.map(attempt => (
                      <Card key={attempt.slotId} className="bg-background/80 backdrop-blur-sm border-primary/20">
                          <CardHeader>
                              <CardTitle className="flex justify-between items-center">
                                  <span>{attempt.format} Quiz</span>
                                  <Badge variant={attempt.score === 5 ? "default" : "secondary"}>
                                      Score: {attempt.score}/{attempt.totalQuestions}
                                  </Badge>
                              </CardTitle>
                          </CardHeader>
                          <CardContent>
                              <p className="text-muted-foreground">Played on {new Date(attempt.timestamp).toLocaleDateString()}</p>
                              <p>Brand: <span className="font-semibold">{attempt.brand}</span></p>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                              {attempt.score === 5 ? (
                                  <p className="text-green-500 font-bold flex items-center"><CheckCircle className="mr-2"/>Reward Claimed</p>
                              ) : <div />}
                              <Button variant="outline" onClick={() => handleAnalysisClick(attempt)}>View Analysis</Button>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          ) : (
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-10 text-center text-muted-foreground">
                      <p>No quiz history found for this filter.</p>
                      <p>Play a quiz to get started!</p>
                  </CardContent>
              </Card>
          )}
        </main>
      </div>

      <Dialog open={isAnalysisOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="bg-background text-foreground max-w-md">
            <DialogHeader>
                <DialogTitle>Quiz Performance Analysis</DialogTitle>
                <DialogDescription>
                    An AI-powered analysis of your {selectedAttempt?.format} quiz attempt.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Your coach is analyzing your game...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, '<br />') || '' }} />
                )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
