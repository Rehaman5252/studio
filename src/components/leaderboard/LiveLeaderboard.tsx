
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Ban, WifiOff, ServerCrash } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { LivePlayer, CurrentQuizLeaderboardDoc } from './leaderboardTypes';

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

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Leaderboard</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const LiveLeaderboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            setError("Firestore is not available.");
            setIsLoading(false);
            return;
        }

        const leaderboardDocRef = doc(db, 'leaderboard', 'currentQuiz');
        const unsubscribe = onSnapshot(leaderboardDocRef, (docSnap) => {
            setIsLoading(true);
            setError(null);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as CurrentQuizLeaderboardDoc;
                const sortedPlayers = (data.players || [])
                    .sort((a, b) => {
                        if (a.disqualified && !b.disqualified) return 1;
                        if (!a.disqualified && b.disqualified) return -1;
                        if (a.score !== b.score) return b.score - a.score;
                        return a.time - b.time;
                    })
                    .map((p, i) => ({ ...p, rank: i + 1 }));
                setPlayers(sortedPlayers);
            } else {
                setPlayers([]);
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Live Leaderboard Error: ", err);
            if ((err as any).code === 'unavailable') {
                setError("You appear to be offline. Please check your connection to view the leaderboard.");
            } else {
                setError("An error occurred while loading the leaderboard. The `leaderboard/currentQuiz` document may be missing.");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        if (isLoading || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (players.length === 0) return (
            <p className="text-center text-muted-foreground p-4">
                The current quiz is in progress. Be the first to play!
            </p>
        );
        
        return players.map((player) => (
            <motion.div 
                key={player.uid} 
                layoutId={`live-player-${player.uid}`}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn(
                    "flex items-center p-2 rounded-lg", 
                    player.uid === user?.uid && !player.disqualified && "bg-primary/20 ring-1 ring-primary", 
                    player.uid === user?.uid && player.disqualified && "bg-destructive/20 ring-1 ring-destructive", 
                    player.disqualified && "opacity-60"
                )}
            >
                <div className="w-8 text-center">{player.disqualified ? <Ban className="text-destructive mx-auto" /> : <RankIcon rank={player.rank!} />}</div>
                <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1"><p className="font-semibold text-foreground">{player.name}</p>{!player.disqualified && <p className="text-sm text-muted-foreground">Score: {player.score}/5</p>}</div>
                <div className="text-right">{player.disqualified ? <p className="font-bold text-destructive">Disqualified</p> : <><p className="font-bold text-primary">{player.time.toFixed(1)}s</p><p className="text-xs text-muted-foreground">Time</p></>}</div>
            </motion.div>
        ));
    };

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg mt-4">
            <CardHeader className="text-center"><CardTitle>🏏 Current Match Standings</CardTitle><CardDescription><LiveInfo /></CardDescription></CardHeader>
            <CardContent><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">{renderContent()}</motion.div></CardContent>
        </Card>
    );
};
export default memo(LiveLeaderboard);
