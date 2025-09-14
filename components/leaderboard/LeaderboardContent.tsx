
'use client';

import React, { memo, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const ChunkLoadError = () => (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Component</AlertTitle>
        <AlertDescription>A piece of the leaderboard failed to load. Please refresh the page.</AlertDescription>
    </Alert>
);

const LiveLeaderboard = dynamic(() => import('@/components/leaderboard/LiveLeaderboard').catch(err => { console.error("Chunk load failed for LiveLeaderboard:", err); return () => <ChunkLoadError /> }), {
    loading: () => <LeaderboardSkeleton count={5} />,
    ssr: false,
});
const AllTimeLeaderboard = dynamic(() => import('@/components/leaderboard/AllTimeLeaderboard').catch(err => { console.error("Chunk load failed for AllTimeLeaderboard:", err); return () => <ChunkLoadError /> }), {
    loading: () => <LeaderboardSkeleton count={5} />,
    ssr: false,
});
const MyNetworkLeaderboard = dynamic(() => import('@/components/leaderboard/MyNetworkLeaderboard').catch(err => { console.error("Chunk load failed for MyNetworkLeaderboard:", err); return () => <ChunkLoadError /> }), {
    loading: () => <LeaderboardSkeleton count={3} />,
    ssr: false,
});
const StreakLeaderboard = dynamic(() => import('@/components/leaderboard/StreakLeaderboard').catch(err => { console.error("Chunk load failed for StreakLeaderboard:", err); return () => <ChunkLoadError /> }), {
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
  const [activeTab, setActiveTab] = useState('live');
  
  if (loading) {
    return <FullPageSkeleton />;
  }
  
  return (
    <Tabs defaultValue="live" className="w-full" onValueChange={setActiveTab}>
        <TabsList className={cn("grid w-full", user ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            {user && <TabsTrigger value="network">My Network</TabsTrigger>}
        </TabsList>
        
        <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
          >
            <TabsContent value="live" forceMount={true} hidden={activeTab !== 'live'}>
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <LiveLeaderboard />
                </Suspense>
            </TabsContent>
            <TabsContent value="all-time" forceMount={true} hidden={activeTab !== 'all-time'}>
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <AllTimeLeaderboard />
                </Suspense>
            </TabsContent>
            <TabsContent value="streaks" forceMount={true} hidden={activeTab !== 'streaks'}>
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <StreakLeaderboard />
                </Suspense>
            </TabsContent>
            {user && (
            <TabsContent value="network" forceMount={true} hidden={activeTab !== 'network'}>
                <Suspense fallback={<LeaderboardSkeleton count={3} />}>
                    <MyNetworkLeaderboard />
                </Suspense>
            </TabsContent>
            )}
        </motion.div>
    </Tabs>
  );
}

const LeaderboardContent = memo(LeaderboardContentComponent);
export default LeaderboardContent;
