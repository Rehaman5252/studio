
'use client';

import React, { memo, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

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
            <Skeleton key={`leaderboard-skel-${i}`} className="h-[60px] w-full" />
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
  const [activeTab, setActiveTab] = useState('live');

  if (loading) {
    return <FullPageSkeleton />;
  }
  
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            {user && <TabsTrigger value="network">My Network</TabsTrigger>}
        </TabsList>
        
        <div className="mt-4 relative">
             <motion.div
               key={activeTab}
               variants={tabContentVariants}
               initial="hidden"
               animate="visible"
            >
                <TabsContent value="live" className={activeTab !== 'live' ? 'hidden' : ''}>
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <LiveLeaderboard />
                    </Suspense>
                </TabsContent>

                <TabsContent value="all-time" className={activeTab !== 'all-time' ? 'hidden' : ''}>
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <AllTimeLeaderboard />
                    </Suspense>
                </TabsContent>

                <TabsContent value="streaks" className={activeTab !== 'streaks' ? 'hidden' : ''}>
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <StreakLeaderboard />
                    </Suspense>
                </TabsContent>
                
                {user && (
                <TabsContent value="network" className={activeTab !== 'network' ? 'hidden' : ''}>
                    <Suspense fallback={<LeaderboardSkeleton count={3} />}>
                        <MyNetworkLeaderboard />
                    </Suspense>
                </TabsContent>
                )}
            </motion.div>
        </div>
    </Tabs>
  );
}

const LeaderboardContent = memo(LeaderboardContentComponent);
export default LeaderboardContent;
