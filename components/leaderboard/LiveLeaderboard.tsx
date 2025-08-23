
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Clock, Ban, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LivePlayer } from './leaderboardTypes';
import { getQuizSlotId } from '@/lib/utils';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player }: { player: LivePlayer }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", player.isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
        <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
        <p className="font-semibold text-foreground flex-1">{player.name}</p>
        {player.disqualified ? (
            <div className="flex items-center gap-1 text-destructive text-sm font-semibold">
                <Ban className="h-4 w-4 text-primary"/> Disqualified
            </div>
        ) : (
            <div className="text-right">
                <p className="font-bold text-primary">{player.score}</p>
                <p className="text-xs text-muted-foreground">{player.time}s</p>
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
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4 text-primary" /> : <ServerCrash className="h-4 w-4 text-primary" />}
        <AlertTitle>Rain Delay!</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const LiveLeaderboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { timeLeft } = useQuizStatus();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [status, setStatus] = useState<'loading' | 'active' | 'waiting' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [slotId, setSlotId] = useState(getQuizSlotId());

     useEffect(() => {
        const interval = setInterval(() => {
            setSlotId(getQuizSlotId());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!db) {
            setError("A technical fault has interrupted play. We're working to get it fixed.");
            setStatus('error');
            return;
        }
        
        const entriesCollection = collection(db, 'leaderboard_live', slotId, 'entries');
        const q = query(entriesCollection, orderBy('score', 'desc'), orderBy('time', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
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
        }, (err) => {
            console.error("Live Leaderboard snapshot error: ", err);
            if (err.code === 'unavailable') {
                setError("Bad connection has stopped play. Please check your network and try again.");
            } else {
                setError("A technical fault has interrupted play. We're working to get it fixed.");
            }
            setStatus('error');
        });

        return () => unsubscribe();
    }, [user, slotId]);

    const renderContent = () => {
        if (status === 'loading' || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (status === 'error' && error) return <ErrorState message={error} />;
        if (status === 'waiting' || players.length === 0) {
            return (
                <Card className="bg-card/80 text-center mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                           <Users className="h-6 w-6 text-primary" /> The Dressing Room is Filling Up...
                        </CardTitle>
                        <CardDescription>The next quiz starts in {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')}. Get ready!</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                       <Clock className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                       <p className="text-sm text-muted-foreground font-semibold">The pitch is ready, players are taking their positions.</p>
                       <p className="text-xs text-muted-foreground mt-1">Play this round to make your mark on the leaderboard! 🏏</p>
                    </CardContent>
                </Card>
            )
        }
        
        return players.map((player) => (
            <LeaderboardItem key={player.userId} player={player} />
        ));
    };


    return (
        <Card className="bg-card/80 shadow-lg mt-4">
            <CardContent className="p-2">
                <div className="space-y-2">{renderContent()}</div>
            </CardContent>
        </Card>
    );
};

export default memo(LiveLeaderboard);
