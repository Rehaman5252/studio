
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { ScrollText, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const QuizHistoryContent = dynamic(() => import('@/components/quiz-history/QuizHistoryContent'), {
  loading: () => <HistorySkeleton />,
  ssr: false,
});

const HistorySkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md mx-auto" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
      </div>
    </div>
);

const HistoryLoginPrompt = () => (
    <Card className="bg-card/80">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ScrollText className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <p className="font-semibold text-lg text-foreground">Track Your Innings</p>
          <p className="mb-4">Log in to see your quiz performance, stats, and AI analysis.</p>
          <Button asChild>
            <Link href="/auth/login">Login to View History</Link>
          </Button>
        </CardContent>
      </Card>
);

export default function QuizHistoryPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
            <HistorySkeleton />
        ) : user ? (
          <QuizHistoryContent />
        ) : (
          <div className="flex items-center justify-center h-full">
            <HistoryLoginPrompt />
          </div>
        )}
      </main>
    </div>
  );
}
