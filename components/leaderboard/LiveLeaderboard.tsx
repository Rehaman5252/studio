
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Clock, Ban, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LivePlayer } from './leaderboardTypes';
import { getQuizSlotId } from '@/lib/utils';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
    if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
    if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
    return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player }: { player: LivePlayer }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", player.isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
        <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name?.charAt(0) || "A"}</AvatarFallback></Avatar>
        <p className="font-semibold text-foreground flex-1">{player.name}</p>
        {player.disqualified ? (
            <div className="flex items-center gap-1 text-destructive text-sm font-semibold">
                <Ban className="h-4 w-4"/> Disqualified
            </div>
        ) : (
            <div className="text-right">
                <p className="font-bold text-primary">{player.score}</p>
                <p className="text-xs text-muted-foreground">{player.time.toFixed(2)}s</p>
            </div>
        )}
    </div>
));
LeaderboardItem.displayName = 'LeaderboardItem';

const LeaderboardItemSkeleton = () => (
    <div className="flex items-center p-2 rounded-lg">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-10 w-10 mx-4 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <div className="text-right space-y-2"><Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-12" /></div>
    </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Rain Delay!</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const WaitingState = ({ timeLeft }: { timeLeft: { minutes: number; seconds: number; }}) => (
    <Card className="bg-card/80 text-center mt-4">
        <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-primary" /> The Dressing Room is Filling Up...
            </CardTitle>
            <CardDescription>The next quiz starts in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}. Get ready!</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <Clock className="h-10 w-10 mx-auto text-primary/50 mb-4" />
            <p className="text-sm text-muted-foreground font-semibold">The pitch is ready, players are taking their positions.</p>
            <p className="text-xs text-muted-foreground mt-1">Play this round to make your mark on the leaderboard! 🏏</p>
        </CardContent>
    </Card>
);

const LiveLeaderboard = () => {
    const { user, loading: authLoading, isOffline } = useAuth();
    const { timeLeft } = useQuizStatus();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [status, setStatus] = useState<'loading' | 'active' | 'waiting' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            setError("A technical fault has interrupted play: Database not available.");
            setStatus('error');
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let lastSlotId = '';

        const setupListener = () => {
            const currentSlotId = getQuizSlotId();
            if (currentSlotId === lastSlotId) return;
            
            lastSlotId = currentSlotId;
            if (unsubscribe) unsubscribe();

            const entriesCollection = collection(db, 'leaderboard_live', currentSlotId, 'entries');
            const q = query(entriesCollection, orderBy('score', 'desc'), orderBy('time', 'asc'), limit(50));

            unsubscribe = onSnapshot(q, (snapshot) => {
                const playersData: LivePlayer[] = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        ...data,
                        rank: index + 1,
                        isCurrentUser: user?.uid === data.userId,
                    } as LivePlayer;
                });
                setPlayers(playersData);
                setStatus(playersData.length > 0 ? 'active' : 'waiting');
                setError(null);
            }, (err: any) => {
                console.error("Live Leaderboard snapshot error: ", err);
                if (err.code === 'unavailable' || isOffline) {
                    setError("Bad connection has stopped play. Please check your network and try again.");
                } else if (err.code === 'failed-precondition') {
                    setError("The leaderboard is being updated. Please check back in a moment.");
                } else {
                    setError("A technical fault has interrupted play. We're working to get it fixed.");
                }
                setStatus('error');
            });
        };

        const interval = setInterval(setupListener, 5000); // Check for new slot every 5 seconds
        setupListener();

        return () => {
            clearInterval(interval);
            if (unsubscribe) unsubscribe();
        };
    }, [user, isOffline]);

    const content = useMemo(() => {
        if (status === 'loading' || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (status === 'error' && error) return <ErrorState message={error} />;
        if (status === 'waiting' || players.length === 0) return <WaitingState timeLeft={timeLeft} />;
        return players.map((player) => <LeaderboardItem key={player.userId} player={player} />);
    }, [status, authLoading, error, players, timeLeft]);

    return (
        <Card className="bg-card/80 shadow-lg mt-4">
            <CardHeader className="text-center">
                <CardTitle>Current Match</CardTitle>
                <CardDescription>Live standings for this 10-minute slot</CardDescription>
            </CardHeader>
            <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">{content}</div>
            </CardContent>
        </Card>
    );
};

export default memo(LiveLeaderboard);
