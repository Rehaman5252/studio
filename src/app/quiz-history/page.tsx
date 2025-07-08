
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import useRequireAuth from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';

const QuizHistoryContent = dynamic(() => import('@/components/quiz-history/QuizHistoryContent'), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md mx-auto" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
      </div>
    </div>
  ),
  ssr: false,
});

export default function QuizHistoryPage() {
  const { user, loading } = useRequireAuth();

  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If not loading and no user, hook will redirect. Render nothing.
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <QuizHistoryContent />
      </main>
    </div>
  );
}
