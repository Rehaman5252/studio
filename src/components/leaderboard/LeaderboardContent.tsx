
'use client';

import React, { memo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import LiveLeaderboard from './LiveLeaderboard';
import AllTimeLeaderboard from './AllTimeLeaderboard';
import MyNetworkLeaderboard from './MyNetworkLeaderboard';
import LoginPrompt from '../auth/LoginPrompt';


const LeaderboardSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
);

function LeaderboardContent() {
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

        <TabsContent value="live"><LiveLeaderboard /></TabsContent>

        <TabsContent value="all-time">
            {user ? (
                 <AllTimeLeaderboard />
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
          <TabsContent value="network"><MyNetworkLeaderboard /></TabsContent>
        )}
    </Tabs>
  );
}

export default memo(LeaderboardContent);
