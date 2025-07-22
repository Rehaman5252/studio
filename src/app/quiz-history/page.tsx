
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { ScrollText } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

// Lazy-load the main content to improve initial page performance.
const QuizHistoryContent = dynamic(() => import('@/components/quiz-history/QuizHistoryContent'), {
  loading: () => <HistorySkeleton />, // Show a skeleton while the component chunk is loading.
  ssr: false, // This component is client-side only.
});

// A skeleton loader to provide immediate visual feedback.
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


export default function QuizHistoryPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
            // The lean AuthProvider is loading, show a skeleton to prevent flashes.
            <HistorySkeleton />
        ) : user ? (
          // User is authenticated, render the component that will fetch its own data.
          <QuizHistoryContent />
        ) : (
          // No user, prompt to log in.
          <div className="flex items-center justify-center h-full">
              <LoginPrompt
                icon={ScrollText}
                title="Track Your Innings"
                description="Log in to see your quiz performance, stats, and AI analysis."
              />
          </div>
        )}
      </main>
    </div>
  );
}
