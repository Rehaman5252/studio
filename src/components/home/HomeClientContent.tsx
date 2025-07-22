
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import QuizSelection from '@/components/home/QuizSelection';
import { Skeleton } from '@/components/ui/skeleton';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Home as HomeIcon } from 'lucide-react';

const HomeSkeleton = () => (
    <div className="space-y-8 animate-pulse mt-10">
        <div className="text-center mb-8">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[288px]">
            <Skeleton className="w-52 h-52 rounded-lg" />
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
  const { user, loading } = useAuth();

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10"
    >
      {user ? (
        <QuizSelection />
      ) : (
        <div className="flex items-center justify-center pt-10">
            <LoginPrompt
                icon={HomeIcon}
                title="Welcome to indcric!"
                description="Sign in to play quizzes, win rewards, and climb the leaderboard."
            />
        </div>
      )}
    </motion.div>
  );
}
