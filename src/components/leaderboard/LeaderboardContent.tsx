
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function LeaderboardContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('live');

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-3" : "grid-cols-1")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            {user && <TabsTrigger value="all-time">All-Time</TabsTrigger>}
            {user && <TabsTrigger value="network">My Network</TabsTrigger>}
        </TabsList>

        <TabsContent value="live"><LiveLeaderboard /></TabsContent>

        {user ? (
          <>
            <TabsContent value="all-time"><AllTimeLeaderboard /></TabsContent>
            <TabsContent value="network"><MyNetworkLeaderboard /></TabsContent>
          </>
        ) : (
          (activeTab === 'all-time' || activeTab === 'network') && (
            <div className="pt-8 w-full">
              <LoginPrompt 
                icon={Users}
                title="View the Rankings"
                description="Pad up and sign in to see the hall of fame and your network."
              />
            </div>
          )
        )}
    </Tabs>
  );
}
