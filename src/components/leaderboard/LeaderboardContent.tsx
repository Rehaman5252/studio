
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, getQuizSlotId } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Ban, WifiOff, ServerCrash } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizAttempt } from '@/lib/mockData';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

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

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Leaderboard</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);


const LiveLeaderboard = memo(() => {
    const { user, userData } = useAuth();
    const [players, setPlayers] = useState<LivePlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }
        
        const db = getFirebaseFirestore();
        if (!db || !user) {
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const historyDocRef = doc(db, 'quizHistory', user.uid);
                const docSnap = await getDoc(historyDocRef);
                let quizHistory: QuizAttempt[] = [];
                if (docSnap.exists()) {
                    quizHistory = docSnap.data().attempts || [];
                }

                const currentSlotId = getQuizSlotId();
                const currentSlotHistory = (quizHistory || []).filter(a => a.slotId === currentSlotId);
                
                const userAttempt = currentSlotHistory.find(a => a.userAnswers && a.questions);

                const livePlayers: LivePlayer[] = [];

                if (userAttempt) {
                    livePlayers.push({
                        uid: user!.uid,
                        name: userData?.name || 'You',
                        score: userAttempt.score,
                        time: userAttempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0,
                        avatar: userData?.photoURL,
                        disqualified: userAttempt.reason === 'malpractice'
                    });
                }
                
                const mockLivePlayers: LivePlayer[] = [
                    { uid: 'mock-player-1', name: 'Ravi Ashwin', score: 5, time: 45.2, avatar: 'https://placehold.co/40x40.png' },
                    { uid: 'mock-player-2', name: 'Jasprit Bumrah', score: 4, time: 55.8, avatar: 'https://placehold.co/40x40.png' },
                    { uid: 'mock-player-3', name: 'Shikhar Dhawan', score: 3, time: 65.1, avatar: 'https://placehold.co/40x40.png', disqualified: true },
                    { uid: 'mock-player-4', name: 'Yuvraj Singh', score: 3, time: 70.0, avatar: 'https://placehold.co/40x40.png' },
                ];
                
                livePlayers.push(...mockLivePlayers.filter(p => p.uid !== user?.uid));
                
                const sortedPlayers = livePlayers.sort((a, b) => {
                     if (a.disqualified && !b.disqualified) return 1;
                     if (!a.disqualified && b.disqualified) return -1;
                     if (a.score !== b.score) return b.score - a.score;
                     return a.time - b.time;
                }).map((p, index) => ({...p, rank: index + 1}));

                setPlayers(sortedPlayers);
            } catch (e: any) {
                console.error("Failed to fetch leaderboard data:", e);
                 if (e.code === 'unavailable' || e.message?.includes('offline')) {
                    setError("You are currently offline. Please check your connection to see live data.");
                } else {
                    setError("Could not load leaderboard data. Please try again later.");
                }
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchHistory();
        
    }, [user, userData]);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        }
        if (error) {
            return <ErrorState message={error} />;
        }
        if (players.length > 0) {
            return players.map((player) => (
                <motion.div 
                    key={player.uid} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                    "flex items-center p-2 rounded-lg", 
                    player.uid === user?.uid && !player.disqualified && "bg-primary/20 ring-1 ring-primary",
                    player.uid === user?.uid && player.disqualified && "bg-destructive/20 ring-1 ring-destructive",
                    player.disqualified && "opacity-60"
                )}>
                    <div className="w-8 text-center">
                        {player.disqualified ? <Ban className="text-destructive mx-auto" /> : <RankIcon rank={player.rank!} />}
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
                </motion.div>
            ));
        }
        return <p className="text-center text-muted-foreground p-4">No players in the current quiz yet. Be the first!</p>;
    }

    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🏏 Current Quiz Leaderboard</CardTitle>
                <CardDescription><LiveInfo /></CardDescription>
            </CardHeader>
            <CardContent>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.05 }}
                    className="space-y-2"
                >
                   {renderContent()}
                </motion.div>
            </CardContent>
        </Card>
    );
});
LiveLeaderboard.displayName = 'LiveLeaderboard';


const AllTimeLeaderboard = memo(() => {
    const { user, userData } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // In a real app, this would be a Firestore query. 
    // We are simulating it based on the user's own data.
    const players: AllTimePlayer[] = useMemo(() => {
        if (!userData || userData.perfectScores === 0) {
            return [];
        }
        return [{
            uid: user!.uid,
            name: userData.name,
            perfectScores: userData.perfectScores,
            totalPlayed: userData.quizzesPlayed,
            avatar: userData.photoURL,
            rank: 1
        }];
    }, [user, userData]);
    
    useEffect(() => {
        // Simulate loading state for consistency
        setIsLoading(true);
        // In a real app, the fetch logic would be here.
        // For this mock, we just wait a bit.
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 1 }).map((_, i) => <LeaderboardItemSkeleton key={i} />);
        }
        // Even if offline, show potentially stale data with a warning.
        if (players.length > 0) {
            return players.map((player) => (
                <motion.div 
                   key={player.uid}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && "bg-primary/20 ring-1 ring-primary")}
                >
                   <div className="w-8 text-center"><RankIcon rank={player.rank!} /></div>
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
               </motion.div>
           ));
        }
        return <p className="text-center text-muted-foreground p-4">Leaderboard is being calculated. Check back soon!</p>;
    }


    return (
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>🏆 All-Time Legends</CardTitle>
                <CardDescription>Based on number of perfect scores</CardDescription>
            </CardHeader>
            <CardContent>
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.05 }}
                    className="space-y-2"
                >
                    {renderContent()}
                </motion.div>
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
                     {players.length > 0 && players[0].name && user?.uid ? (
                        players.map((player, index) => (
                             <div key={user.uid} className={cn("flex items-center p-2 rounded-lg", player.uid === user?.uid && "bg-primary/20 ring-1 ring-primary")}>
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
  const { user } = useAuth();

  return (
    <Tabs defaultValue="live" className="w-full">
        <TabsList className={cn("grid w-full", user ? "grid-cols-3" : "grid-cols-2")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            {user && <TabsTrigger value="my-leaderboard">My Network</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="live">
            <LiveLeaderboard />
        </TabsContent>

        <TabsContent value="all-time">
            <AllTimeLeaderboard />
        </TabsContent>

        {user && 
            <TabsContent value="my-leaderboard">
                <MyNetworkLeaderboard />
            </TabsContent>
        }
    </Tabs>
  );
}
