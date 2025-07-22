
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { ScrollText, Play } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
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

const GuestPrompt = () => (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md bg-card/80 shadow-lg border-primary/20 text-center">
            <CardContent className="p-8">
                <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                    <ScrollText className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">See Your Quiz History</h2>
                <p className="text-muted-foreground mt-2 mb-6">Log in and play a few quizzes to see your performance analysis and track your progress over time.</p>
                <Button asChild size="lg">
                    <Link href="/auth/login"><Play className="mr-2"/> Start Playing</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
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
          <GuestPrompt />
        )}
      </main>
    </div>
  );
}
