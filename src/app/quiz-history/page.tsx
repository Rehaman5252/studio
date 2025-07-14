
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Loader2, ScrollText } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

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
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : user ? (
          <QuizHistoryContent />
        ) : (
          <div className="flex items-center justify-center h-full">
            <LoginPrompt 
              icon={ScrollText}
              title="View Your History"
              description="Please log in to see your past quiz attempts and performance analysis."
            />
          </div>
        )}
      </main>
    </div>
  );
}
