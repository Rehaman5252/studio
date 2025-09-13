
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CricketLoading } from '@/components/CricketLoading';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const QuizClient = dynamic(
  async () => {
    try {
      return await import('@/components/quiz/QuizClient');
    } catch (error) {
      console.error('Failed to load QuizClient chunk', error);
      return function ChunkLoadFallback() {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Quiz</AlertTitle>
              <AlertDescription>
                Failed to load the quiz UI. Please refresh the page to try again.
              </AlertDescription>
            </Alert>
          </div>
        );
      };
    }
  },
  {
    loading: () => <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>,
    ssr: false,
  }
);

function QuizPageContent() {
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'Default Brand';
  const format = searchParams.get('format') || 'Mixed';

  if (!brand || !format) {
    return <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>
  }

  return <QuizClient brand={brand} format={format} />;
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>}>
      <AuthGuard>
        <QuizPageContent />
      </AuthGuard>
    </Suspense>
  );
}
