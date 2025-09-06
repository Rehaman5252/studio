
'use client';

import React from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const LeaderboardSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="pt-4 space-y-2">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
);


export default function LeaderboardPage() {
  const loginPromptProps = {
      icon: Users,
      title: "View the Leaderboard",
      description: "Sign in to see how you stack up against the competition."
  };
  
  return (
    <PageWrapper title="Hall of Fame">
        <AuthGuard loadingSkeleton={<LeaderboardSkeleton />} loginPrompt={loginPromptProps}>
            <LeaderboardContent />
        </AuthGuard>
    </PageWrapper>
  );
}
