
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import QuizSelection from '@/components/home/QuizSelection';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function HomeClientContent() {
  const { loading: authLoading } = useAuth();
  
  // The skeleton is now handled by the dynamic import on the page itself.
  // We can directly render the content.
  if (authLoading) {
    return <HomeContentSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-10"
    >
        <QuizSelection />
    </motion.div>
  );
}
