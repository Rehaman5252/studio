
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import type { AllTimePlayer } from './leaderboardTypes';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ServerCrash, WifiOff } from 'lucide-react';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

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

const AllTimeLeaderboard = () => {
    const [players, setPlayers] = useState<AllTimePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllTimePlayers = async () => {
            const db = getFirebaseFirestore();
            if (!db) {
                setError("Database not available.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const q = query(
                    collection(db, "users"),
                    orderBy("perfectScores", "desc"),
                    limit(10)
                );
                const snapshot = await getDocs(q);
                const playersData = snapshot.docs.map((doc, index) => ({
                    rank: index + 1,
                    uid: doc.id,
                    name: doc.data().name || 'Anonymous Player',
                    perfectScores: doc.data().perfectScores || 0,
                    totalPlayed: doc.data().quizzesPlayed || 0,
                    avatar: doc.data().photoURL
                }));
                setPlayers(playersData);
            } catch (e: any) {
                console.error("Error fetching all-time leaderboard:", e);
                setError("Could not load the all-time leaderboard.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllTimePlayers();
    }, []);

    const renderContent = () => {
        if (isLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (players.length === 0) return <p className="text-center text-muted-foreground p-4">No legends yet. Score perfect quizzes to appear here!</p>;

        return players.map((player) => (
            <motion.div key={player.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center p-2 rounded-lg">
               <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
               <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
               <div className="flex-1"><p className="font-semibold text-foreground">{player.name}</p><p className="text-sm text-muted-foreground">Played: {player.totalPlayed}</p></div>
               <div className="text-right"><p className="font-bold text-primary">{player.perfectScores}</p><p className="text-xs text-muted-foreground">Perfect Scores</p></div>
           </motion.div>
       ));
    };

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg mt-4">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">
                    {renderContent()}
                </motion.div>
            </CardContent>
        </Card>
    );
};

export default memo(AllTimeLeaderboard);
