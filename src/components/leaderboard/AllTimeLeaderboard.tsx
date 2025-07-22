
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AllTimePlayer } from './leaderboardTypes';

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
};

const LeaderboardItemSkeleton = () => (
    <div className="flex items-center p-2 rounded-lg">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-10 w-10 mx-4 rounded-full" />
        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
        <div className="text-right space-y-2"><Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-12" /></div>
    </div>
);

const AllTimeLeaderboard = () => {
    const { user, profile } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    
    // This is mocked for now. A real implementation would query an aggregated collection.
    const players: AllTimePlayer[] = useMemo(() => {
        if (!profile || (profile.perfectScores || 0) === 0) return [];
        return [{
            uid: user!.uid,
            name: profile.name,
            perfectScores: profile.perfectScores || 0,
            totalPlayed: profile.quizzesPlayed || 0,
            avatar: profile.photoURL,
            rank: 1
        }];
    }, [user, profile]);
    
    useEffect(() => {
        // Simulating a fetch
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    if (isLoading) return <LeaderboardItemSkeleton />;

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">
                    {players.length > 0 ? players.map((player) => (
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
};

export default memo(AllTimeLeaderboard);
