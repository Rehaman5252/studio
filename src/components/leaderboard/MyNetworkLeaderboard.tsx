
'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebaseClient';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { QuizAttempt } from '@/lib/mockData';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Star } from 'lucide-react';
import type { MyNetworkPlayer } from './leaderboardTypes';

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
        <AlertTitle>Error Loading Network</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const MyNetworkLeaderboard = () => {
    const { user, profile } = useAuth();
    const [networkPlayers, setNetworkPlayers] = useState<MyNetworkPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !profile) {
            setIsLoading(false);
            return;
        }

        const fetchNetworkData = async () => {
            setIsLoading(true);
            setError(null);
            if (!db) {
                setError("Database not available.");
                setIsLoading(false);
                return;
            }

            try {
                const networkIds = [...(profile.referrals || [])];
                if (profile.referredBy && !networkIds.includes(profile.referredBy)) {
                    networkIds.push(profile.referredBy);
                }

                if (networkIds.length === 0) {
                    setNetworkPlayers([]);
                    setIsLoading(false);
                    return;
                }
                
                const playerPromises = networkIds.map(id => getDoc(doc(db, 'users', id)));
                const playerDocs = await Promise.all(playerPromises);
                
                const playersData: MyNetworkPlayer[] = [];

                for (const playerDoc of playerDocs) {
                    if (playerDoc.exists()) {
                        const playerData = playerDoc.data();
                        
                        const q = query(
                            collection(db, 'users', playerDoc.id, 'quizAttempts'), 
                            where('score', '==', 5), 
                            orderBy('timestamp', 'desc'), 
                            limit(1)
                        );
                        
                        const perfectScoreSnapshot = await getDocs(q);
                        let latestPerfectScore: QuizAttempt | null = null;
                        if (!perfectScoreSnapshot.empty) {
                            latestPerfectScore = perfectScoreSnapshot.docs[0].data() as QuizAttempt;
                        }

                        playersData.push({
                            uid: playerDoc.id,
                            name: playerData.name || 'Unknown User',
                            avatar: playerData.photoURL,
                            perfectScores: playerData.perfectScores || 0,
                            isReferrer: playerDoc.id === profile.referredBy,
                            latestPerfectScoreTimestamp: latestPerfectScore?.timestamp || null,
                        });
                    }
                }
                
                const sortedPlayers = playersData.sort((a, b) => b.perfectScores - a.perfectScores);
                setNetworkPlayers(sortedPlayers.map((p, i) => ({ ...p, rank: i + 1 })));

            } catch (e: any) {
                if (e.code === 'unavailable') {
                    setError("You appear to be offline. Please check your connection.");
                } else {
                    setError("Could not load your network's leaderboard.");
                }
                console.error("Error fetching network leaderboard:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNetworkData();

    }, [user, profile]);


    const renderContent = () => {
        if (isLoading) return Array.from({ length: 3 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState message={error} />;
        if (networkPlayers.length === 0) {
            return (
                <Card className="bg-card/80 border-dashed border-primary/30 text-center mt-4">
                    <CardHeader>
                        <CardTitle>Build Your Network</CardTitle>
                        <CardDescription>Refer friends to see their stats here!</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">Once your friends sign up using your referral link, you'll be able to track their performance and earn rewards.</p>
                    </CardContent>
                </Card>
            )
        }
        
        return networkPlayers.map((player) => (
            <motion.div key={player.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-center p-2 rounded-lg")}>
                <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
                <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-foreground">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.isReferrer ? 'Your Referrer' : 'Your Referral'}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                    <div className="flex flex-col items-center">
                        <p className="font-bold text-primary flex items-center gap-1">{player.perfectScores} <Star className="h-4 w-4" /></p>
                        <p className="text-xs text-muted-foreground">Perfect</p>
                    </div>
                </div>
            </motion.div>
        ));
    };


    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg mt-4">
            <CardHeader className="text-center">
                <CardTitle>My Network</CardTitle>
                <CardDescription>Track your friends' perfect scores</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">{renderContent()}</div>
            </CardContent>
        </Card>
    );
};

export default memo(MyNetworkLeaderboard);
