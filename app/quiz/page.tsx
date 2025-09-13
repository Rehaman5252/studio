
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CricketLoading } from '@/components/CricketLoading';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const QuizClient = dynamic(
  async () => {
    try {
      return await import('@/components/quiz/QuizClient');
    } catch (error) {
      console.error('Failed to load QuizClient chunk', error);
      // Return a component that displays an error and a refresh button
      return () => (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <h2 className="text-xl font-semibold">Failed to load quiz</h2>
          <p className="text-muted-foreground mb-4">A network error occurred. Please check your connection and try again.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
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
