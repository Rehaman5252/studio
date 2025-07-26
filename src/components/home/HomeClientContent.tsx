
'use client';

import React, { memo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import QuizSelection from '@/components/home/QuizSelection';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuizStatus } from '@/context/QuizStatusProvider';

const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse mt-10">
        <div className="text-center mb-8">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[192px]">
            <Skeleton className="w-48 h-48 rounded-lg" />
        </div>
        <Skeleton className="h-[124px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-full" />
    </div>
);

function HomeClientContentComponent() {
  const { loading: authLoading } = useAuth();
  const { isLoading: quizStatusLoading } = useQuizStatus();
  
  if (authLoading || quizStatusLoading) {
    return <HomeContentSkeleton />;
  }

  return (
    <div className="mt-10 animate-fade-in-up">
        <QuizSelection />
    </div>
  );
}

const HomeClientContent = memo(HomeClientContentComponent);
export default HomeClientContent;
