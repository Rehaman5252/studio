
'use client';

import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import HomeClientContent from '@/components/home/HomeClientContent';
import { useQuizStatus } from '@/context/QuizStatusProvider';

function HomePage() {
    const { loading: isAuthLoading } = useAuth();
    const { isLoading: isQuizStatusLoading } = useQuizStatus();

    // The combined loading state.
    const isLoading = isAuthLoading || isQuizStatusLoading;

    if (isLoading) {
      return (
         <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="p-4 flex items-center justify-center">
          <div className="text-center">
              <h1 className="text-6xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                indcric
              </h1>
              <p className="text-sm text-muted-foreground">Win ₹100 every 100 seconds!</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-2">
            <HomeClientContent />
          </div>
        </main>
      </div>
    );
}

export default HomePage;
