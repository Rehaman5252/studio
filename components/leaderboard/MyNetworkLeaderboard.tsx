"use client";

import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { WifiOff, ServerCrash, Star, Users } from 'lucide-react';
import type { MyNetworkPlayer } from './leaderboardTypes';
import { Button } from '../ui/button';
import Link from 'next/link';
import { mapFirestoreError } from '@/lib/utils';

const RankIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player }: { player: MyNetworkPlayer }) => (
    <div className="flex items-center p-2 rounded-lg">
        <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
        <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name.charAt(0)}</AvatarFallback></Avatar>
        <div className="flex-1">
            <p className="font-semibold text-foreground">{player.name}</p>
            <p className="text-sm text-muted-foreground">{player.isReferrer ? 'Your Referrer' : 'Your Referral'}</p>
        </div>
        <div className="text-right flex items-center gap-2">
            <div className="flex flex-col items-center">
                <p className="font-bold text-primary flex items-center gap-1">{player.perfectScores} <Star className="h-4 w-4 text-primary" /></p>
                <p className="text-xs text-muted-foreground">Perfect</p>
            </div>
        </div>
    </div>
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

const ErrorState = ({ message, title }: { message: string, title: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("Connection") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const MyNetworkLeaderboard = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const [networkPlayers, setNetworkPlayers] = useState<MyNetworkPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ title: string; message: string } | null>(null);

    useEffect(() => {
        if (authLoading || !user || !profile) {
            if (!authLoading) setIsLoading(false);
            return;
        }
        if (!db) {
            setError({ title: "Database Error", message: "A technical fault has interrupted play: Database not available."});
            setIsLoading(false);
            return;
        }

        const fetchNetworkData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const networkIds: string[] = [...(profile.referrals || [])];
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
                
                const playersData: MyNetworkPlayer[] = playerDocs
                    .filter(doc => doc.exists())
                    .map(doc => {
                        const data = doc.data();
                        return {
                            uid: doc.id,
                            name: data.name || 'Unknown User',
                            avatar: data.photoURL,
                            perfectScores: data.perfectScores || 0,
                            isReferrer: doc.id === profile.referredBy,
                        };
                    });
                
                const sortedPlayers = playersData.sort((a, b) => b.perfectScores - a.perfectScores);
                setNetworkPlayers(sortedPlayers.map((p, i) => ({ ...p, rank: i + 1 })));

            } catch (e: any) {
                console.error("Error fetching network leaderboard:", e);
                setError(mapFirestoreError(e));
            } finally {
                setIsLoading(false);
            }
        };

        fetchNetworkData();

    }, [user, profile, authLoading]);


    const renderContent = () => {
        if (isLoading || authLoading) return Array.from({ length: 3 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        if (error) return <ErrorState title={error.title} message={error.message} />;
        if (networkPlayers.length === 0) {
            return (
                <Card className="bg-card/80 text-center mt-4">
                     <CardContent className="p-6">
                        <Users className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                        <p className="font-semibold text-lg text-foreground">Build Your Squad 🤝</p>
                        <p className="text-sm text-muted-foreground">Refer friends to see their stats here and form a winning partnership!</p>
                        <Button asChild size="sm" className="mt-4"><Link href="/profile">Get Referral Code</Link></Button>
                    </CardContent>
                </Card>
            )
        }
        
        return networkPlayers.map((player) => (
            <LeaderboardItem key={player.uid} player={player} />
        ));
    };


    return (
        <Card className="bg-card/80 shadow-lg mt-4">
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
