
'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { ScrollText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

function QuizHistoryPageContentWrapper() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // No useEffect needed here as child components handle login prompt
    // This page should be viewable by non-logged-in users to see the prompt.

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : !user ? (
            <div className="flex items-center justify-center h-full">
                <LoginPrompt
                    icon={ScrollText}
                    title="Check Your Scorebook"
                    description="You haven't faced any deliveries yet. To see your match history and past performances, please step up to the crease by signing in."
                />
            </div>
        ) : (
             <QuizHistoryContent />
        )}
      </main>
    </div>
  );
}

export default function QuizHistoryPage() {
    return <QuizHistoryPageContentWrapper />;
}
