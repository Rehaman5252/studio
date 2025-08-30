
"use client";

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Trophy, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AllTimePlayer } from './leaderboardTypes';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
    if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
    if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
    return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser }: { player: AllTimePlayer, isCurrentUser?: boolean }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
        <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name?.charAt(0) || 'A'}</AvatarFallback></Avatar>
        <div className="flex-1">
            <p className="font-semibold text-foreground flex-1">{player.name}</p>
            <p className="text-xs text-muted-foreground">Played: {player.quizzesPlayed} | Total Score: {player.totalScore}</p>
        </div>
        <div className="text-right flex items-center gap-1">
            <p className="font-bold text-primary">{player.perfectScores}</p>
            <Star className="h-4 w-4 text-primary" />
        </div>
    </div>
));
LeaderboardItem.displayName = 'LeaderboardItem';

const LeaderboardItemSkeleton = () => (
    <div className="flex items-center p-2 rounded-lg">
        <Skeleton key="skel-rank" className="w-8 h-8 rounded-full" />
        <Skeleton key="skel-avatar" className="h-10 w-10 mx-4 rounded-full" />
        <div key="skel-info" className='flex-1 space-y-2'>
            <Skeleton key="skel-name" className="h-4 w-3/4" />
            <Skeleton key="skel-stats" className="h-3 w-1/2" />
        </div>
        <Skeleton key="skel-score" className="h-4 w-12" />
    </div>
);

const EmptyState = () => (
    <Card className="bg-card/80 text-center mt-4">
        <CardContent className="p-6">
            <Trophy className="h-10 w-10 mx-auto text-primary/50 mb-4" />
            <p className="font-semibold text-lg text-foreground">The Honours Board is Awaiting Its First Legend 🏆</p>
            <p className="text-sm text-muted-foreground">Score a perfect 5/5 to etch your name in history!</p>
        </CardContent>
    </Card>
);

const ErrorState = ({ message, title }: { message: string, title: string }) => (
    <Alert variant="destructive" className="mt-4">
        {(message || '').includes("offline") || (message || '').includes("Connection") || (message || '').includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message || 'An unexpected error occurred.'}</AlertDescription>
    </Alert>
);

const WarningBanner = ({ text }: { text: string }) => (
    <Alert variant="default" className="mb-4 bg-yellow-900/50 text-yellow-300 border-yellow-700">
        <AlertTriangle className="h-4 w-4 !text-yellow-300" />
        <AlertTitle>Partial Results</AlertTitle>
        <AlertDescription>{text}</AlertDescription>
    </Alert>
);

const AllTimeLeaderboard = () => {
    const { user, leaderboardAllTime } = useAuth();

    const content = useMemo(() => {
        if (leaderboardAllTime.loading) {
          return Array.from({ length: 10 }).map((_, i) => <LeaderboardItemSkeleton key={`skel-alltime-${i}`} />);
        }

        // If there are no rows at all, show the friendly empty/error states:
        if ((!leaderboardAllTime.rows || leaderboardAllTime.rows.length === 0)) {
            if (leaderboardAllTime.error) {
                // show the error state if there are no fallback rows
                return <ErrorState title="Error Loading Leaderboard" message={leaderboardAllTime.error} />;
            }
            return <EmptyState />;
        }

        // If we have rows, show them. If there's an error too (partial/fallback), show a small warning banner above.
        const playersWithRank = leaderboardAllTime.rows.map((player, index) => ({
            ...player,
            rank: index + 1,
        }));

        return playersWithRank.map(player => (
            <LeaderboardItem key={player.uid} player={player} isCurrentUser={user?.uid === player.uid}/>
        ));
    }, [leaderboardAllTime, user]);

    return (
        <Card className="bg-card/80 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>All-Time Honours Board</CardTitle>
                <CardDescription>Based on Total Score and Perfect Scores</CardDescription>
            </CardHeader>
            <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
                {/* Show a small in-panel warning if there was a partial-results fallback */}
                {leaderboardAllTime.error && leaderboardAllTime.rows && leaderboardAllTime.rows.length > 0 && (
                    <WarningBanner text={leaderboardAllTime.error} />
                )}
                <div className="space-y-2">{content}</div>
            </CardContent>
        </Card>
    );
};

export default memo(AllTimeLeaderboard);
