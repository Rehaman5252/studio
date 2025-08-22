
'use client';

import React, { memo, useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakPlayer } from './leaderboardTypes';

const RankIcon = memo(({ rank }: { rank: number | undefined }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    if (!rank) return <span className="text-lg font-bold text-muted-foreground">--</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
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

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Rain Delay!</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const StreakLeaderboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState<StreakPlayer[]>([]);
    const [currentUserData, setCurrentUserData] = useState<StreakPlayer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!db) {
            setError("Firestore is not available.");
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

                const playersData = querySnapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        uid: doc.id,
                        name: data.name || 'Anonymous Player',
                        avatar: data.photoURL,
                        currentStreak: data.currentStreak || 0,
                        rank: index + 1,
                        isCurrentUser: user?.uid === doc.id,
                    };
                }).filter(player => player.currentStreak > 0);
                
                setPlayers(playersData);

                if (user && !playersData.some(p => p.uid === user.uid)) {
                   const userDocRef = doc(db, 'users', user.uid);
                   const userDoc = await getDoc(userDocRef);
                   if (userDoc.exists()) {
                        const data = userDoc.data();
                        if ((data.currentStreak || 0) > 0) {
                            setCurrentUserData({
                                uid: user.uid,
                                name: data.name || 'You',
                                avatar: data.photoURL,
                                currentStreak: data.currentStreak,
                                rank: undefined, // No rank for users outside top 50
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
                if (e.code === 'failed-precondition') {
                    setError("The covers are on! Our leaderboard is being prepared. Please check back in a moment.");
                } else if (e.code === 'unavailable') {
                    setError("Bad connection has stopped play. Please check your network and try again.");
                } else {
                     setError("A technical fault has interrupted play. We're working to get it fixed.");
                }
                console.error("Error fetching streak leaderboard:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();

    }, [authLoading, user]);


    const renderContent = () => {
        if (isLoading || authLoading) return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (players.length === 0) {
            return (
                 <Card className="bg-card/80 text-center mt-4">
                    <CardContent className="p-6">
                        <Trophy className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                        <p className="font-semibold text-lg text-foreground">The Consistency Chart is Empty</p>
                        <p className="text-sm text-muted-foreground">Play daily to build your streak and claim the top spot!</p>
                    </CardContent>
                </Card>
            )
        }
        
        return (
            <>
                {players.map((player) => (
                    <LeaderboardItem key={player.uid} player={player} isCurrentUser={player.isCurrentUser} />
                ))}
                {currentUserData && (
                    <>
                        <div className="text-center text-muted-foreground text-sm py-2">...</div>
                        <LeaderboardItem player={currentUserData} isCurrentUser={true} />
                    </>
                )}
            </>
        );
    };


    return (
        <Card className="bg-card/80 shadow-lg mt-4">
            <CardHeader className="text-center">
                <CardTitle>Daily Streak Champions</CardTitle>
                <CardDescription>The most consistent players on the pitch.</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
                <div className="space-y-2">{renderContent()}</div>
            </CardContent>
        </Card>
    );
};

export default memo(StreakLeaderboard);
