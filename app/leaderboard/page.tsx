'use client';

import React from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

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
  return (
    <PageWrapper title="Hall of Fame">
        <AuthGuard>
            <LeaderboardContent />
        </AuthGuard>
    </PageWrapper>
  );
}
