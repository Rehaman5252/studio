
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, getQuizSlotId } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { useAuth } from '@/context/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, SlashCircle } from 'lucide-react';

interface LivePlayer {
    rank?: number;
    name: string;
    score: number;
    time: number;
    avatar?: string;
    uid: string;
    disqualified?: boolean;
}

interface AllTimePlayer {
    rank?: number;
    name: string;
    perfectScores: number;
    totalPlayed: number;
    avatar?: string;
    uid: string;
}

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
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="text-right space-y-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-12" />
        </div>
    </div>
);


const LiveLeaderboard = memo(() => {
    const { user } = useAuth();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }
        const slotId = getQuizSlotId();
        const leaderboardRef = collection(db, 'liveLeaderboard', slotId, 'entries');
        const q = query(leaderboardRef, orderBy('score', 'desc'), orderBy('time', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPlayers: LivePlayer[] = [];
            let visibleRank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const player: LivePlayer = {
                    uid: doc.id,
                    name: data.name,
                    score: data.score,
                    time: data.time,
                    avatar: data.avatar,
                    disqualified: data.disqualified,
                };
                // Assign rank only to non-disqualified players
                if (!player.disqualified) {
                    player.rank = visibleRank++;
                }
                fetchedPlayers.push(player);
            });
            setPlayers(fetchedPlayers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching live leaderboard:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🏏 Current Quiz Leaderboard</CardTitle>
                <CardDescription><LiveInfo /></CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />)
                    ) : players.length > 0 ? (
                        players.map((player) => (
                            <div key={player.uid} className={cn(
                                "flex items-center p-2 rounded-lg", 
                                player.uid === user?.uid && !player.disqualified && "bg-primary/20 ring-1 ring-primary",
                                player.uid === user?.uid && player.disqualified && "bg-destructive/20 ring-1 ring-destructive",
                                player.disqualified && "opacity-60"
                            )}>
                                <div className="w-8 text-center">
                                    {player.disqualified ? <SlashCircle className="text-destructive mx-auto" /> : <RankIcon rank={player.rank!} />}
                                </div>
                                <Avatar className="h-10 w-10 mx-4">
                                    <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} />
                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{player.name}</p>
                                    {!player.disqualified && <p className="text-sm text-muted-foreground">Score: {player.score}/5</p>}
                                </div>
                                <div className="text-right">
                                    {player.disqualified ? (
                                        <p className="font-bold text-destructive">Disqualified</p>
                                    ) : (
                                        <>
                                        <p className="font-bold text-primary">{player.time.toFixed(1)}s</p>
                                        <p className="text-xs text-muted-foreground">Time</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground p-4">No players in the current quiz yet. Be the first!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});
LiveLeaderboard.displayName = 'LiveLeaderboard';


const AllTimeLeaderboard = memo(() => {
    const { user } = useAuth();
    const [players, setPlayers] = useState<AllTimePlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('perfectScores', 'desc'), limit(50));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPlayers: AllTimePlayer[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Only include users who have played at least one game
                if (data.perfectScores > 0 || data.quizzesPlayed > 0) {
                    fetchedPlayers.push({
                        uid: doc.id,
                        name: data.name,
                        perfectScores: data.perfectScores || 0,
                        totalPlayed: data.quizzesPlayed || 0,
                        avatar: data.photoURL,
                    });
                }
            });
            setPlayers(fetchedPlayers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching all-time leaderboard:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🏆 All-Time Legends</CardTitle>
                <CardDescription>Based on number of perfect scores</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {loading ? (
                       Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />)
                    ) : players.length > 0 ? (
                        players.map((player, index) => (
                             <div key={player.uid} className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && "bg-primary/20 ring-1 ring-primary")}>
                                <div className="w-8 text-center"><RankIcon rank={index + 1} /></div>
                                <Avatar className="h-10 w-10 mx-4">
                                    <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} />
                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{player.name}</p>
                                    <p className="text-sm text-muted-foreground">Played: {player.totalPlayed}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{player.perfectScores}</p>
                                    <p className="text-xs text-muted-foreground">Perfect Scores</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-center text-muted-foreground p-4">Leaderboard is being calculated. Check back soon!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});
AllTimeLeaderboard.displayName = 'AllTimeLeaderboard';


const MyNetworkLeaderboard = memo(() => {
    const { user, userData } = useAuth();
    
    // In a real scenario, this would fetch friends' data.
    // For now, it just shows the current user.
    const players = userData ? [{
        uid: user?.uid,
        name: userData.name,
        perfectScores: userData.perfectScores || 0,
        avatar: userData.photoURL
    }] : [];

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🤝 My Referral Network</CardTitle>
                <CardDescription>Your performance against friends</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                     {players.length > 0 && players[0].name ? (
                        players.map((player, index) => (
                             <div key={player.uid} className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && "bg-primary/20 ring-1 ring-primary")}>
                                <div className="w-8 text-center"><RankIcon rank={index + 1} /></div>
                                <Avatar className="h-10 w-10 mx-4">
                                    <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} />
                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{player.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{player.perfectScores}</p>
                                    <p className="text-xs text-muted-foreground">Perfect Scores</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <LeaderboardItemSkeleton />
                    )}
                </div>
                 <div className="text-center p-4 mt-4 bg-muted rounded-lg">
                    <p className="font-semibold">Grow your network!</p>
                    <p className="text-sm text-muted-foreground">Share your referral code from your profile to see your friends here.</p>
                </div>
            </CardContent>
        </Card>
    );
});
MyNetworkLeaderboard.displayName = 'MyNetworkLeaderboard';


export default function LeaderboardContent() {
  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="live">Current</TabsTrigger>
        <TabsTrigger value="all-time">All-Time</TabsTrigger>
        <TabsTrigger value="my-leaderboard">My Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="live">
            <LiveLeaderboard />
        </TabsContent>

        <TabsContent value="all-time">
            <AllTimeLeaderboard />
        </TabsContent>

        <TabsContent value="my-leaderboard">
            <MyNetworkLeaderboard />
        </TabsContent>
    </Tabs>
  );
}

    
