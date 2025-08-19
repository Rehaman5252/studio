
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import QuizHistoryContent from '@/components/history/QuizHistoryContent';

const HistorySkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
    </div>
);

export default function HistoryPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>
       <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {loading ? <HistorySkeleton /> : user ? <QuizHistoryContent /> : (
            <div className="pt-8">
                <LoginPrompt 
                    icon={History}
                    title="View Your Quiz History"
                    description="Sign in to see all your past quiz attempts and review your performance."
                />
            </div>
        )}
      </main>
    </div>
  );
}
