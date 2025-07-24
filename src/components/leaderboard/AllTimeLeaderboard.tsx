
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import type { AllTimePlayer } from './leaderboardTypes';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ServerCrash, WifiOff, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser }: { player: AllTimePlayer, isCurrentUser?: boolean }) => (
     <motion.div 
        layoutId={`all-time-player-${player.uid}`}
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className={cn(
            "flex items-center p-2 rounded-lg",
            isCurrentUser && "bg-primary/20 ring-1 ring-primary"
        )}
    >
        <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
        <div className="flex-1"><p className="font-semibold text-foreground">{player.name}</p><p className="text-sm text-muted-foreground">Played: {player.totalPlayed}</p></div>
        <div className="text-right"><p className="font-bold text-primary">{player.perfectScores}</p><p className="text-xs text-muted-foreground">Perfect Scores</p></div>
    </motion.div>
));
LeaderboardItem.displayName = 'LeaderboardItem';


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
    const { user, profile } = useAuth();
    const [players, setPlayers] = useState<AllTimePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRank, setUserRank] = useState<AllTimePlayer | null>(null);

    useEffect(() => {
        if (!db) {
            setError("Firestore is not available.");
            setIsLoading(false);
            return;
        }

        const fetchLeaderboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch top 10 players with at least one perfect score
                const top10Query = query(
                    collection(db, "users"),
                    where("perfectScores", ">", 0),
                    orderBy("perfectScores", "desc"),
                    orderBy("quizzesPlayed", "desc"),
                    limit(10)
                );
                const top10Snapshot = await getDocs(top10Query);
                
                const top10Players = top10Snapshot.docs.map((doc, index) => ({
                    rank: index + 1,
                    uid: doc.id,
                    name: doc.data().name || 'Anonymous Player',
                    perfectScores: doc.data().perfectScores,
                    totalPlayed: doc.data().quizzesPlayed || 0,
                    avatar: doc.data().photoURL
                }));
                setPlayers(top10Players);

                // If user is logged in, find their rank
                if (user && profile) {
                    const userPerfectScores = profile.perfectScores || 0;
                    const isUserInTop10 = top10Players.some(p => p.uid === user.uid);

                    if (userPerfectScores > 0 && !isUserInTop10) {
                        // Find how many players have more perfect scores than the user
                        const rankQuery = query(
                            collection(db, "users"),
                            where("perfectScores", ">", userPerfectScores)
                        );
                        const higherRankedSnapshot = await getCountFromServer(rankQuery);
                        const rank = higherRankedSnapshot.data().count + 1;
                        
                        setUserRank({
                            rank: rank,
                            uid: user.uid,
                            name: profile.name,
                            perfectScores: userPerfectScores,
                            totalPlayed: profile.quizzesPlayed || 0,
                            avatar: profile.photoURL,
                        });
                    } else {
                         // User is either in top 10 or has 0 perfect scores, so no separate rank display needed
                         setUserRank(null);
                    }
                }
                
            } catch (e: any) {
                console.error("Error fetching all-time leaderboard:", e);
                 if (e.code === 'failed-precondition') {
                    setError("A Firestore index is required. Please check the developer console for a link to create it automatically.");
                    console.error("Firestore Index Creation Link:", e.message);
                } else if (e.code === 'unavailable') {
                    setError("You appear to be offline. Please check your connection.");
                } else if (e.code === 'permission-denied') {
                    setError("Leaderboard permission denied. Check security rules for the 'users' collection.");
                } else {
                    setError("Could not load the all-time leaderboard.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [user, profile]);

    const renderContent = () => {
        if (isLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (players.length === 0) return <p className="text-center text-muted-foreground p-4">No legends yet. Score perfect quizzes to appear here!</p>;

        return (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }} className="space-y-2">
                    {players.map((player) => (
                        <LeaderboardItem key={player.uid} player={player} isCurrentUser={player.uid === user?.uid} />
                    ))}
                </motion.div>
                {userRank && (
                     <div className="mt-4">
                        <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Your Rank</span></div></div>
                        <LeaderboardItem player={userRank} isCurrentUser={true} />
                    </div>
                )}
            </>
        )
    };

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg mt-4">
            <CardHeader className="text-center"><CardTitle>🏆 All-Time Legends</CardTitle><CardDescription>Based on number of perfect scores</CardDescription></CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default memo(AllTimeLeaderboard);
