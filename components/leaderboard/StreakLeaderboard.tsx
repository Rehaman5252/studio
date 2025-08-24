
"use client";

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, getCountFromServer, where } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Trophy, Flame } from 'lucide-react';
import { cn, mapFirestoreError } from '@/lib/utils';
import type { StreakPlayer } from './leaderboardTypes';

const RankIcon = memo(({ rank }: { rank: number | undefined }) => {
    if (!rank) return <span aria-label="Unranked" className="text-lg font-bold text-muted-foreground">--</span>;
    if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
    if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
    if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
    return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser = false }: { player: StreakPlayer, isCurrentUser?: boolean }) => (
    <div className={cn("flex items-center p-2 rounded-lg transition-colors", isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
        <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
        <p className="font-semibold text-foreground flex-1">{player.name}</p>
        <div className="text-right flex items-center gap-1">
            <p className="font-bold text-primary">{player.currentStreak}</p>
            <Flame className="h-4 w-4 text-primary" />
        </div>
    </div>
));
LeaderboardItem.displayName = 'LeaderboardItem';

const LeaderboardItemSkeleton = () => (
    <div className="flex items-center p-2 rounded-lg">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-10 w-10 mx-4 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-12" />
    </div>
);

const ErrorState = ({ message, title }: { message: string, title: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("Connection") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const EmptyState = () => (
    <Card className="bg-card/80 text-center mt-4">
        <CardContent className="p-6">
            <Trophy className="h-10 w-10 mx-auto text-primary/50 mb-4" />
            <p className="font-semibold text-lg text-foreground">The Consistency Chart is Empty</p>
            <p className="text-sm text-muted-foreground">Play daily to build your streak and claim the top spot!</p>
        </CardContent>
    </Card>
);

const StreakLeaderboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState<StreakPlayer[]>([]);
    const [currentUserData, setCurrentUserData] = useState<StreakPlayer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{title: string, message: string} | null>(null);

    const calculateUserRank = useCallback(async (streak: number, name: string): Promise<number> => {
        if (!db) return 999;
        const usersCollection = collection(db, 'users');
        
        try {
            const higherStreakQuery = query(usersCollection, where('currentStreak', '>', streak));
            const tieBreakerQuery = query(
                usersCollection, 
                where('currentStreak', '==', streak), 
                where('name', '<', name)
            );
            
            const [higherSnapshot, tieSnapshot] = await Promise.all([
                getCountFromServer(higherStreakQuery),
                getCountFromServer(tieBreakerQuery)
            ]);

            return higherSnapshot.data().count + tieSnapshot.data().count + 1;
        } catch (e: any) {
            console.error("Rank calculation failed:", e);
            // In case of index error etc., return a non-breaking value
            return 999; 
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!db) {
            setError({ title: "Technical Fault", message: "Database not available."});
            setIsLoading(false);
            return;
        }

        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const usersCollection = collection(db, 'users');
                const q = query(usersCollection, orderBy('currentStreak', 'desc'), orderBy('name', 'asc'), limit(50));
                const querySnapshot = await getDocs(q);

                const playersData = querySnapshot.docs
                    .filter(doc => (doc.data().currentStreak || 0) > 0)
                    .map((doc, index) => {
                        const data = doc.data();
                        return {
                            uid: doc.id,
                            name: data.name || 'Anonymous Player',
                            avatar: data.photoURL,
                            currentStreak: data.currentStreak || 0,
                            isCurrentUser: user?.uid === doc.id,
                            rank: index + 1
                        };
                    });
                
                setPlayers(playersData);

                if (user && !playersData.some(p => p.uid === user.uid)) {
                   const userDocRef = doc(db, 'users', user.uid);
                   const userDoc = await getDoc(userDocRef);
                   if (userDoc.exists()) {
                        const data = userDoc.data();
                        const streak = data.currentStreak || 0;
                        const name = data.name || 'Anonymous Player';

                        if (streak > 0) {
                            const userRank = await calculateUserRank(streak, name);
                            setCurrentUserData({
                                uid: user.uid,
                                name: data.name || 'You',
                                avatar: data.photoURL,
                                currentStreak: streak,
                                rank: userRank,
                                isCurrentUser: true,
                            });
                        } else {
                            setCurrentUserData(null);
                        }
                   }
                } else {
                    setCurrentUserData(null);
                }

            } catch (e: any) {
                setError(mapFirestoreError(e));
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();

    }, [authLoading, user, calculateUserRank]);


    const content = useMemo(() => {
        if (isLoading || authLoading) return Array.from({ length: 10 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState title={error.title} message={error.message} />;
        if (players.length === 0) return <EmptyState />;
        
        return (
            <>
                {players.map((player) => (
                    <LeaderboardItem key={player.uid} player={player} isCurrentUser={player.isCurrentUser} />
                ))}
                {currentUserData && (
                    <>
                        <div className="border-t my-2 text-center text-sm text-muted-foreground pt-2">Your Rank</div>
                        <LeaderboardItem player={currentUserData} isCurrentUser={true} />
                    </>
                )}
            </>
        );
    }, [isLoading, authLoading, error, players, currentUserData]);


    return (
        <Card className="bg-card/80 shadow-lg mt-4">
            <CardHeader className="text-center">
                <CardTitle>Daily Streak Champions</CardTitle>
                <CardDescription>The most consistent players on the pitch.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">{content}</div>
            </CardContent>
        </Card>
    );
};

export default memo(StreakLeaderboard);
