'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestion } from '@/ai/schemas';
import { CheckCircle, Trophy, BarChart, History } from 'lucide-react';

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

const mockHistory: QuizAttempt[] = [
  { slotId: '1', brand: 'Nike', format: 'ODI', score: 5, totalQuestions: 5, questions: [], userAnswers: [], timestamp: new Date().setDate(new Date().getDate() - 1) },
  { slotId: '2', brand: 'boAt', format: 'IPL', score: 3, totalQuestions: 5, questions: [], userAnswers: [], timestamp: new Date().setDate(new Date().getDate() - 2) },
  { slotId: '3', brand: 'SBI', format: 'Test', score: 5, totalQuestions: 5, questions: [], userAnswers: [], timestamp: new Date().setDate(new Date().getDate() - 3) },
  { slotId: '4', brand: 'Myntra', format: 'WPL', score: 2, totalQuestions: 5, questions: [], userAnswers: [], timestamp: new Date().setDate(new Date().getDate() - 4) },
];


export default function QuizHistoryPage() {
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'perfect'>('recent');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, you would fetch this from localStorage or an API
    setHistory(mockHistory);
  }, []);

  const filteredHistory = history.filter(attempt => {
    if (filter === 'perfect') return attempt.score === attempt.totalQuestions;
    if (filter === 'recent') return true; // Already sorted by date
    return true;
  }).sort((a,b) => b.timestamp - a.timestamp);

  if (!isClient) {
    return null;
  }
  
  return (
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
                            <Button variant="outline">View Details</Button>
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
  );
}
