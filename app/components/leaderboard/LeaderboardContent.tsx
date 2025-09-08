
'use client';

import React, { memo, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

const LiveLeaderboard = dynamic(() => import('@/components/leaderboard/LiveLeaderboard'), {
    loading: () => <LeaderboardSkeleton count={5} />,
    ssr: false,
});
const AllTimeLeaderboard = dynamic(() => import('@/components/leaderboard/AllTimeLeaderboard'), {
    loading: () => <LeaderboardSkeleton count={5} />,
    ssr: false,
});
const MyNetworkLeaderboard = dynamic(() => import('@/components/leaderboard/MyNetworkLeaderboard'), {
    loading: () => <LeaderboardSkeleton count={3} />,
    ssr: false,
});
const StreakLeaderboard = dynamic(() => import('@/components/leaderboard/StreakLeaderboard'), {
    loading: () => <LeaderboardSkeleton count={5} />,
    ssr: false,
});

const LeaderboardSkeleton = ({ count = 5 }: { count?: number }) => (
    <div className="pt-4 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={`leaderboard-skel-${i}`} className="h-[60px] w-full animate-pulse" />
        ))}
    </div>
);

const FullPageSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <LeaderboardSkeleton />
    </div>
);

function LeaderboardContentComponent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <FullPageSkeleton />;
  }
  
  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            {user && <TabsTrigger value="network">My Network</TabsTrigger>}
        </TabsList>
        
        <div className="mt-4">
            <TabsContent value="live">
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <LiveLeaderboard />
                </Suspense>
            </TabsContent>
            <TabsContent value="all-time">
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <AllTimeLeaderboard />
                </Suspense>
            </TabsContent>
            <TabsContent value="streaks">
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <StreakLeaderboard />
                </Suspense>
            </TabsContent>
            {user && (
            <TabsContent value="network">
                <Suspense fallback={<LeaderboardSkeleton count={3} />}>
                    <MyNetworkLeaderboard />
                </Suspense>
            </TabsContent>
            )}
        </div>
    </Tabs>
  );
}

const LeaderboardContent = memo(LeaderboardContentComponent);
export default LeaderboardContent;
