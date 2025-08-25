
"use client";

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AllTimePlayer } from './leaderboardTypes';
import { mapFirestoreError } from '@/lib/utils';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
    if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
    if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
    return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player }: { player: AllTimePlayer }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", player.isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
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
        {message.includes("offline") || message.includes("Connection") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const AllTimeLeaderboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState<AllTimePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ title: string; message: string } | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!db) {
            setError({ title: "Technical Fault", message: "Database not available." });
            setIsLoading(false);
            return;
        }

        const usersCollection = collection(db, 'users');
        const q = query(
            usersCollection, 
            orderBy('totalScore', 'desc'),
            orderBy('perfectScores', 'desc'), 
            orderBy('quizzesPlayed', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const playersData = querySnapshot.docs
                .filter(doc => (doc.data().quizzesPlayed || 0) > 0)
                .map((doc, index) => {
                    const data = doc.data();
                    return {
                        uid: doc.id,
                        name: data.name || 'Anonymous Player',
                        avatar: data.photoURL,
                        perfectScores: data.perfectScores || 0,
                        totalScore: data.totalScore || 0,
                        quizzesPlayed: data.quizzesPlayed || 0,
                        isCurrentUser: user?.uid === doc.id,
                        rank: index + 1
                    };
                });

            setPlayers(playersData);
            setIsLoading(false);
            setError(null);
        }, (err: any) => {
            console.error("All-Time Leaderboard snapshot error: ", err);
            setError(mapFirestoreError(err));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authLoading, user]);

    const content = useMemo(() => {
        if (isLoading || authLoading) {
          return Array.from({ length: 10 }).map((_, i) => <LeaderboardItemSkeleton key={`skel-alltime-${i}`} />);
        }
        if (error) return <ErrorState title={error.title} message={error.message} />;
        if (players.length === 0) return <EmptyState />;
        return players.map((player) => <LeaderboardItem key={player.uid} player={player} />);
    }, [isLoading, authLoading, error, players]);

    return (
        <Card className="bg-card/80 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>All-Time Honours Board</CardTitle>
                <CardDescription>Based on Perfect Scores and Total Runs</CardDescription>
            </CardHeader>
            <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">{content}</div>
            </CardContent>
        </Card>
    );
};

export default memo(AllTimeLeaderboard);
