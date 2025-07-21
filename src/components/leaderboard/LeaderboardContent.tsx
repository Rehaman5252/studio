
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, getQuizSlotId } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizAttempt } from '@/lib/mockData';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import LoadingFallback from '@/components/common/LoadingFallback';
import FirebaseOfflineAlert from '@/components/common/FirebaseOfflineAlert';


interface LivePlayer { rank?: number; name: string; score: number; time: number; avatar?: string; uid: string; disqualified?: boolean; }
interface AllTimePlayer { rank?: number; name: string; perfectScores: number; totalPlayed: number; avatar?: string; uid: string; }

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

const LiveLeaderboard = memo(() => {
    const { user, profile, loading: authLoading, firestoreReady } = useAuth();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user || !firestoreReady) {
            setIsLoading(false);
            return;
        };

        const db = getFirebaseFirestore();
        if (!db) {
            setError("Could not connect to the database.");
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        const fetchLivePlayers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Mock data for demonstration
                const mockLivePlayers: LivePlayer[] = [
                    { uid: 'mock-player-1', name: 'Ravi Ashwin', score: 5, time: 45.2, avatar: 'https://placehold.co/40x40.png' },
                    { uid: 'mock-player-2', name: 'Jasprit Bumrah', score: 4, time: 55.8, avatar: 'https://placehold.co/40x40.png' },
                    { uid: 'mock-player-3', name: 'Shikhar Dhawan', score: 3, time: 65.1, avatar: 'https://placehold.co/40x40.png', disqualified: true },
                    { uid: 'mock-player-4', name: 'Yuvraj Singh', score: 3, time: 70.0, avatar: 'https://placehold.co/40x40.png' },
                ];
                
                const q = query(collection(db, "users", user.uid, "quizAttempts"), where("slotId", "==", getQuizSlotId()), limit(1));
                const userAttemptSnap = await getDocs(q);

                if (!cancelled && !userAttemptSnap.empty) {
                    const attempt = userAttemptSnap.docs[0].data() as QuizAttempt;
                    mockLivePlayers.push({
                        uid: user.uid, name: profile?.name || 'You', score: attempt.score,
                        time: attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0,
                        avatar: profile?.photoURL, disqualified: attempt.reason === 'malpractice'
                    });
                }
                
                if (!cancelled) {
                    const uniquePlayers = Array.from(new Map(mockLivePlayers.map(p => [p.uid, p])).values());
                    const sorted = uniquePlayers.sort((a, b) => {
                        if (a.disqualified && !b.disqualified) return 1;
                        if (!a.disqualified && b.disqualified) return -1;
                        if (a.score !== b.score) return b.score - a.score;
                        return a.time - b.time;
                    }).map((p, i) => ({ ...p, rank: i + 1 }));
                    setPlayers(sorted);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError("Could not load leaderboard data.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };
        fetchLivePlayers();

        return () => { cancelled = true; }
    }, [user, profile, authLoading, firestoreReady]);

    const renderContent = () => {
        if (isLoading || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <FirebaseOfflineAlert />;
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
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏏 Current Quiz Leaderboard</CardTitle><CardDescription><LiveInfo /></CardDescription></CardHeader>
            <CardContent><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">{renderContent()}</motion.div></CardContent>
        </Card>
    );
});
LiveLeaderboard.displayName = 'LiveLeaderboard';


const AllTimeLeaderboard = memo(() => {
    const { user, profile } = useAuth();
    const players: AllTimePlayer[] = useMemo(() => {
        if (!user || !profile) return [];
        return [{
            uid: user.uid,
            name: profile.name || 'You',
            perfectScores: profile.perfectScores || 0,
            totalPlayed: profile.quizzesPlayed || 0,
            avatar: profile.photoURL,
            rank: 1
        }];
    }, [user, profile]);

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">
                    {players.length > 0 && players[0].totalPlayed > 0 ? players.map((player) => (
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


export default function LeaderboardContent() {
  const { user } = useAuth();

  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-2" : "grid-cols-1")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            {user && <TabsTrigger value="all-time">All-Time</TabsTrigger>}
        </TabsList>
        <TabsContent value="live"><LiveLeaderboard /></TabsContent>
        {user && <TabsContent value="all-time"><AllTimeLeaderboard /></TabsContent>}
    </Tabs>
  );
}
