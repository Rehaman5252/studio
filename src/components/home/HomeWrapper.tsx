
'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import GlobalStats from '@/components/home/GlobalStats';
import QuizSelector from '@/components/home/QuizSelector';

export default function HomeWrapper() {
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);

  const handleStartQuiz = useCallback((brand: string, format: string) => {
    if (hasPlayedInCurrentSlot) {
      router.push(`/quiz/results?review=true`);
    } else {
      router.push(`/quiz?brand=${encodeURIComponent(brand)}&format=${encodeURIComponent(format)}`);
    }
  }, [router, hasPlayedInCurrentSlot]);
  
  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
        <p className="text-sm text-muted-foreground">Click a face on the cube to start!</p>
      </div>
      
      <QuizSelector onStartQuiz={handleStartQuiz} />

      <Separator className="my-8 bg-border/50" />

      <GlobalStats />
    </>
  );
}
