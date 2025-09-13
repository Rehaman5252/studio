
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CricketLoading } from '@/components/CricketLoading';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QuizClient = dynamic(
  async () => {
    try {
      return await import('@/components/quiz/QuizClient');
    } catch (error) {
      console.error('Failed to load QuizClient chunk', error);
      // fallback functional component
      return function ChunkLoadFallback() {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <p className="text-destructive mb-2">Failed to load the quiz UI.</p>
              <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
            </div>
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
