
'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { ScrollText } from 'lucide-react';

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


function QuizHistoryPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Innings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
            <HistorySkeleton />
        ) : user ? (
          <QuizHistoryContent />
        ) : (
          <div className="pt-4">
            <LoginPrompt
                icon={ScrollText}
                title="Review Your Performance"
                description="Sign in to view your past quizzes, stats, and AI-powered analysis."
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default memo(QuizHistoryPage);
