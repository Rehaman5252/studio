
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CricketLoading } from '@/components/CricketLoading';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/ClientOnly';

const QuizClient = dynamic(
  () => import('@/components/quiz/QuizClient').catch(err => {
    console.error("Failed to load QuizClient chunk", err);
    return function ChunkLoadFallback() {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Error</AlertTitle>
            <AlertDescription>
              A core part of the quiz failed to load. Please refresh the page.
               <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }),
  {
    loading: () => <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>,
    ssr: false,
  }
);


function QuizPageContent() {
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'Default Brand';
  const format = searchParams.get('format') || 'Mixed';
  
  // Key to force remounting of the component on retry
  const [key, setKey] = useState(0);

  const retryQuizFetch = () => {
    console.warn("Retrying quiz fetch...");
    setKey(prev => prev + 1);
  };

  if (!brand || !format) {
    return <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>
  }

  return (
    <ClientOnly retry={retryQuizFetch}>
      <QuizClient key={key} brand={brand} format={format} />
    </ClientOnly>
  );
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
