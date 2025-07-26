
'use client';

import React, { memo, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import LoginPrompt from '../auth/LoginPrompt';

const LiveLeaderboard = dynamic(() => import('./LiveLeaderboard'), {
    loading: () => <LeaderboardItemSkeleton count={5} />,
    ssr: false,
});
const AllTimeLeaderboard = dynamic(() => import('./AllTimeLeaderboard'), {
    loading: () => <LeaderboardItemSkeleton count={5} />,
    ssr: false,
});
const MyNetworkLeaderboard = dynamic(() => import('./MyNetworkLeaderboard'), {
    loading: () => <LeaderboardItemSkeleton count={3} />,
    ssr: false,
});


const LeaderboardItemSkeleton = ({ count = 5 }: { count?: number }) => (
    <div className="pt-2 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full" />
        ))}
    </div>
);

const LeaderboardSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <LeaderboardItemSkeleton />
    </div>
);

function LeaderboardContentComponent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('live');

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-3" : "grid-cols-2")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            {user && <TabsTrigger value="network">My Network</TabsTrigger>}
        </TabsList>

        <TabsContent value="live">
            <Suspense fallback={<LeaderboardItemSkeleton />}>
                <LiveLeaderboard />
            </Suspense>
        </TabsContent>

        <TabsContent value="all-time">
            {user ? (
                 <Suspense fallback={<LeaderboardItemSkeleton />}>
                    <AllTimeLeaderboard />
                </Suspense>
            ) : (
                <div className="pt-8 w-full">
                    <LoginPrompt 
                        icon={Users}
                        title="View the Hall of Fame"
                        description="Pad up and sign in to see the all-time cricket legends."
                    />
                </div>
            )}
        </TabsContent>
        
        {user && (
          <TabsContent value="network">
             <Suspense fallback={<LeaderboardItemSkeleton count={3} />}>
                <MyNetworkLeaderboard />
            </Suspense>
          </TabsContent>
        )}
    </Tabs>
  );
}

const LeaderboardContent = memo(LeaderboardContentComponent);
export default LeaderboardContent;
