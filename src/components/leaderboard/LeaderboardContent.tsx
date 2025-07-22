
'use client';

import React, { memo, useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ServerCrash, WifiOff } from 'lucide-react';
import LiveLeaderboard from './LiveLeaderboard';
import AllTimeLeaderboard from './AllTimeLeaderboard';
import MyNetworkLeaderboard from './MyNetworkLeaderboard';
import { cn } from '@/lib/utils';
import LoginPrompt from '../auth/LoginPrompt';
import { Users } from 'lucide-react';

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

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Leaderboard</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function LeaderboardContent() {
  const { user, loading, profile } = useAuth();

  const hasNetwork = useMemo(() => {
    if (!profile) return false;
    const referredBy = profile.referredBy;
    const referrals = profile.referrals || [];
    return !!referredBy || referrals.length > 0;
  }, [profile]);

  if (loading) {
      return <LeaderboardSkeleton />;
  }

  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-3" : "grid-cols-1")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            {user && <TabsTrigger value="all-time">All-Time</TabsTrigger>}
            {user && <TabsTrigger value="network" disabled={!hasNetwork}>My Network</TabsTrigger>}
        </TabsList>

        <TabsContent value="live">
          <LiveLeaderboard />
        </TabsContent>

        {user && (
          <>
            <TabsContent value="all-time">
                <AllTimeLeaderboard />
            </TabsContent>
            <TabsContent value="network">
                {hasNetwork ? (
                    <MyNetworkLeaderboard />
                ) : (
                    <Card className="bg-card/80 border-dashed border-primary/30 text-center">
                        <CardHeader>
                            <CardTitle>Build Your Network</CardTitle>
                            <CardDescription>Refer friends to see their stats here!</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">Once your friends sign up using your referral link, you'll be able to track their performance and earn rewards.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
          </>
        )}
    </Tabs>
  );
}
