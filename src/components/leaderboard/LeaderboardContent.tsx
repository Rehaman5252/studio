
'use client';

import React, { memo } from 'react';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { Ban, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import LoginPrompt from '../auth/LoginPrompt';
import { Trophy } from 'lucide-react';

interface LivePlayer { rank?: number; name: string; score: number; time: number; avatar?: string; uid: string; disqualified?: boolean; }
interface AllTimePlayer { rank?: number; name: string; perfectScores: number; totalPlayed: number; avatar?: string; uid: string; }

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
};

const LiveLeaderboard = memo(({ user, profile }: { user: User | null; profile: any; }) => {
    // This component now receives user/profile as props.
    // The actual data fetching would be done on the server and passed down.
    // For now, we'll just display a placeholder message.
    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏏 Current Quiz Leaderboard</CardTitle><CardDescription><LiveInfo /></CardDescription></CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground p-4">Play in the current slot to appear on the live leaderboard!</p>
            </CardContent>
        </Card>
    );
});
LiveLeaderboard.displayName = 'LiveLeaderboard';


const AllTimeLeaderboard = memo(({ user, profile }: { user: User | null; profile: any; }) => {
    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground p-4">Play quizzes to appear on the All-Time leaderboard!</p>
            </CardContent>
        </Card>
    );
});
AllTimeLeaderboard.displayName = 'AllTimeLeaderboard';


const MyNetworkLeaderboard = memo(() => {
    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🤝 My Network</CardTitle>
                <CardDescription>Compare your performance with friends.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <Users className="h-12 w-12 mb-4" />
                <p className="font-semibold text-lg text-foreground">Coming Soon!</p>
                <p>The ability to add friends and build your network is on its way.</p>
            </CardContent>
        </Card>
    );
});
MyNetworkLeaderboard.displayName = 'MyNetworkLeaderboard';


export default function LeaderboardContent({ user, profile }: { user: User | null; profile: any; }) {
  if (!user) {
      return (
          <div className="flex items-center justify-center h-full pt-10">
              <LoginPrompt
                  icon={Trophy}
                  title="View the Rankings"
                  description="Log in or sign up to see where you stand on the leaderboard."
              />
          </div>
      );
  }

  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="network">My Network</TabsTrigger>
        </TabsList>
        <TabsContent value="live"><LiveLeaderboard user={user} profile={profile} /></TabsContent>
        <TabsContent value="all-time"><AllTimeLeaderboard user={user} profile={profile} /></TabsContent>
        <TabsContent value="network"><MyNetworkLeaderboard /></TabsContent>
    </Tabs>
  );
}
