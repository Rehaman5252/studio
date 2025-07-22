'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import type { AllTimePlayer, LivePlayer } from './leaderboardTypes';
import type { DecodedIdToken } from 'firebase-admin/auth';

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
};

const LiveLeaderboard = memo(() => {
    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏏 Current Quiz Leaderboard</CardTitle><CardDescription><LiveInfo /></CardDescription></CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground p-4">Play in the current slot to appear on the live leaderboard! This data is updated in real-time.</p>
            </CardContent>
        </Card>
    );
});
LiveLeaderboard.displayName = 'LiveLeaderboard';

const AllTimeLeaderboard = memo(({ user, players }: { user: DecodedIdToken | null; players: AllTimePlayer[] }) => {
    const rankedPlayers = useMemo(() => {
        return players
            .sort((a, b) => b.perfectScores - a.perfectScores)
            .map((p, i) => ({ ...p, rank: i + 1 }));
    }, [players]);

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">
                    {rankedPlayers.length > 0 ? rankedPlayers.map((player) => (
                        <motion.div key={player.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && "bg-primary/20 ring-1 ring-primary")}>
                           <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
                           <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
                           <div className="flex-1"><p className="font-semibold text-foreground">{player.name}</p><p className="text-sm text-muted-foreground">Played: {player.totalPlayed}</p></div>
                           <div className="text-right"><p className="font-bold text-primary">{player.perfectScores}</p><p className="text-xs text-muted-foreground">Perfect Scores</p></div>
                       </motion.div>
                   )) : <p className="text-center text-muted-foreground p-4">Play quizzes to appear on the All-Time leaderboard!</p>}
                </motion.div>
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
                <p>Refer friends to see their stats here. This feature is under development.</p>
            </CardContent>
        </Card>
    );
});
MyNetworkLeaderboard.displayName = 'MyNetworkLeaderboard';

export default function LeaderboardContent({ initialUser, initialLeaderboard }: { initialUser: DecodedIdToken | null; initialProfile: any; initialLeaderboard: AllTimePlayer[] }) {
  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="network">My Network</TabsTrigger>
        </TabsList>
        <TabsContent value="live"><LiveLeaderboard /></TabsContent>
        <TabsContent value="all-time"><AllTimeLeaderboard user={initialUser} players={initialLeaderboard} /></TabsContent>
        <TabsContent value="network"><MyNetworkLeaderboard /></TabsContent>
    </Tabs>
  );
}
