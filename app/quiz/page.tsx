
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CricketLoading } from '@/components/CricketLoading';
import dynamic from 'next/dynamic';

const QuizClient = dynamic(() => import('@/components/quiz/QuizClient'), {
  loading: () => <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>,
  ssr: false,
});

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
      <QuizPageContent />
    </Suspense>
  );
}
