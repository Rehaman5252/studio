
"use client";

import React, { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff, ServerCrash, Clock, Ban, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn, getQuizSlotId } from '@/lib/utils';
import type { LivePlayer } from './leaderboardTypes';
import { mapFirestoreError } from '@/lib/utils';
import { Button } from '../ui/button';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Unsubscribe } from 'firebase/firestore';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
    if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
    if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
    return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser }: { player: LivePlayer, isCurrentUser?: boolean }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
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
    <div className="flex items-center p-2 rounded-lg animate-pulse">
        <Skeleton key="skel-rank" className="w-8 h-8 rounded-full" />
        <Skeleton key="skel-avatar" className="h-10 w-10 mx-4 rounded-full" />
        <Skeleton key="skel-name" className="h-4 flex-1" />
        <div key="skel-score-container" className="text-right space-y-2">
            <Skeleton key="skel-score" className="h-4 w-8 ml-auto" />
            <Skeleton key="skel-time" className="h-3 w-12 ml-auto" />
        </div>
    </div>
);

const ErrorState = ({ message, title, isIndexError, onRetry }: { message: string, title: string, isIndexError?: boolean, onRetry: () => void }) => (
     isIndexError ? (
        <Alert variant="default" className="m-4 bg-yellow-900/50 text-yellow-300 border-yellow-700">
            <AlertTriangle className="h-4 w-4 !text-yellow-300" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    ) : (
    <Alert variant="destructive" className="m-4">
        {(message || '').includes("offline") || (message || '').includes("Connection") || (message || '').includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mb-4">{message || 'An unexpected error occurred.'}</AlertDescription>
        <Button onClick={onRetry} variant="secondary" size="sm"><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button>
    </Alert>
    )
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
    const { user, loading: authLoading } = useAuth();
    const { timeLeft } = useQuizStatus();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ code?: string, userMessage: string } | null>(null);
    const listenerRef = useRef<Unsubscribe>();

    const startListener = useCallback(() => {
        if (listenerRef.current) {
            listenerRef.current();
        }
        setIsLoading(true);
        setError(null);

        if (!db) {
            setError({ userMessage: "Database not available." });
            setIsLoading(false);
            return;
        }
        
        const slotId = getQuizSlotId();
        const q = query(
            collection(db, 'leaderboard_live', slotId, 'entries'),
            orderBy('score', 'desc'),
            orderBy('time', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rows = snapshot.docs.map((d, index) => ({
                ...(d.data() as LivePlayer),
                rank: index + 1,
            }));
            setPlayers(rows);
            setError(null);
            setIsLoading(false);
        }, (err) => {
            console.error("Live Leaderboard Error: ", err);
            setError(mapFirestoreError(err));
            setIsLoading(false);
        });
        
        listenerRef.current = unsubscribe;
    }, []);

    useEffect(() => {
        startListener();
        const slotCheckInterval = setInterval(() => {
            startListener();
        }, 30000); // Refresh listener every 30 seconds to catch slot changes

        return () => {
            if (listenerRef.current) listenerRef.current();
            clearInterval(slotCheckInterval);
        };
    }, [startListener]);

    const content = useMemo(() => {
        if (isLoading || authLoading) {
            return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={`skel-live-${i}`} />);
        }
        if (error) {
            return <ErrorState 
                title={error.code === "INDEX_REQUIRED" ? "Leaderboard Indexing" : "Error Loading Leaderboard"} 
                message={error.userMessage}
                isIndexError={error.code === "INDEX_REQUIRED"}
                onRetry={startListener}
            />;
        }
        if (players.length === 0) return <WaitingState timeLeft={timeLeft} />;
        
        return players.map((player) => (
            <LeaderboardItem key={player.userId} player={player} isCurrentUser={user?.uid === player.userId} />
        ));
    }, [isLoading, authLoading, error, players, timeLeft, user, startListener]);

    return (
        <Card className="bg-card/80 shadow-lg">
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

    