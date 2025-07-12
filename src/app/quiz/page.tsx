
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import type { QuizQuestion } from '@/ai/schemas';

const QuizSkeleton = () => (
    <div className="p-4 animate-pulse">
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl font-bold mb-4">Loading Quiz...</h2>
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    </div>
);

function QuizComponent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'default';
  
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (brand) {
      // In a real app, you would fetch questions from an API
      // For now, we'll just simulate a fetch
      setTimeout(() => {
          setQuestions([
              { questionText: `Question 1 for ${brand}`, options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' },
              { questionText: 'Question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B' },
          ]);
      }, 1000);
    }
  }, [brand]);

  if (loading || !user) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  if (!questions) {
      return <QuizSkeleton />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Quiz for {brand}</h1>
      {questions.map((q, idx) => (
        <div key={idx} className="my-2 p-4 border rounded-lg">
            <p>{q.questionText}</p>
        </div>
      ))}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizSkeleton />}>
        <QuizComponent />
    </Suspense>
  )
}
