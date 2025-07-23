
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getQuizSlotId } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Ban, WifiOff, ServerCrash } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizAttempt } from '@/lib/mockData';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { LivePlayer } from './leaderboardTypes';

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
    const { user, profile, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !db) return;

        const fetchLivePlayers = async () => {
            setIsLoading(true);
            setError(null);
            const slotId = getQuizSlotId();
            try {
                // This is a collection group query. It requires a composite index in Firestore.
                // If you see a 'permission-denied' or 'failed-precondition' error in the console,
                // it will contain a link to create the index automatically.
                const q = query(
                    collectionGroup(db, 'quizAttempts'), 
                    where("slotId", "==", slotId),
                    orderBy("score", "desc"),
                    orderBy("timePerQuestion"), // This needs an array of numbers to work correctly
                    limit(50)
                );

                const snapshot = await getDocs(q);
                const attemptsData = snapshot.docs.map(doc => ({ ...doc.data(), path: doc.ref.path } as QuizAttempt & { path: string }));
                
                // Get user profiles for each attempt
                const playerPromises = attemptsData.map(async (attempt) => {
                    const userId = attempt.path.split('/')[1]; // Extracts user ID from path 'users/{userId}/quizAttempts/{slotId}'
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    const userData = userDoc.data();
                    const totalTime = Array.isArray(attempt.timePerQuestion) ? attempt.timePerQuestion.reduce((a, b) => a + b, 0) : 0;
                    
                    return {
                        uid: userId,
                        name: userData?.name || 'Anonymous',
                        score: attempt.score,
                        time: totalTime,
                        avatar: userData?.photoURL,
                        disqualified: !!attempt.reason?.startsWith('malpractice'),
                    };
                });
                
                let livePlayers = await Promise.all(playerPromises);
                
                // Add the current user to the list if they've played but are not in the top 50
                if (user && !livePlayers.some(p => p.uid === user.uid)) {
                    const userAttemptDoc = await getDoc(doc(db, 'users', user.uid, 'quizAttempts', slotId));
                    if (userAttemptDoc.exists()) {
                        const attempt = userAttemptDoc.data() as QuizAttempt;
                         const totalTime = Array.isArray(attempt.timePerQuestion) ? attempt.timePerQuestion.reduce((a, b) => a + b, 0) : 0;
                        livePlayers.push({
                            uid: user.uid, name: profile?.name || 'You', score: attempt.score,
                            time: totalTime,
                            avatar: profile?.photoURL, disqualified: !!attempt.reason?.startsWith('malpractice')
                        });
                    }
                }
                
                // Sort and rank the players
                const sorted = livePlayers.sort((a, b) => {
                    if (a.disqualified && !b.disqualified) return 1;
                    if (!a.disqualified && b.disqualified) return -1;
                    if (a.score !== b.score) return b.score - a.score;
                    return a.time - b.time;
                }).map((p, i) => ({ ...p, rank: i + 1 }));

                setPlayers(sorted);
            } catch (e: any) {
                if (e.code === 'unavailable') {
                  setError("You appear to be offline. Please check your connection to view the leaderboard.");
                } else if (e.code === 'failed-precondition') {
                    setError("A Firestore index is required for this query. Please check the console logs for a link to create it automatically in your Firebase console.");
                } else {
                  setError("An error occurred while loading the leaderboard.");
                  console.error("Live Leaderboard Error: ", e);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchLivePlayers();
    }, [user, profile, authLoading]);

    const renderContent = () => {
        if (isLoading || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (players.length === 0) return <p className="text-center text-muted-foreground p-4">No players in the current quiz yet. Be the first!</p>;
        
        return players.map((player) => (
            <motion.div key={player.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && !player.disqualified && "bg-primary/20 ring-1 ring-primary", player.uid === user?.uid && player.disqualified && "bg-destructive/20 ring-1 ring-destructive", player.disqualified && "opacity-60")}>
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
