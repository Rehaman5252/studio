"use client";

import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff, ServerCrash, Trophy, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AllTimePlayer } from './leaderboardTypes';
import { mapFirestoreError } from '@/lib/utils';
import { Button } from '../ui/button';

const RankIcon = memo(({ rank }: { rank?: number }) => {
  if (!rank) return <span aria-label="Unranked" className="text-lg font-bold text-muted-foreground">--</span>;
  if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
  if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
  if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
  return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser }: { player: AllTimePlayer, isCurrentUser?: boolean }) => (
  <div className={cn("flex items-center p-2 rounded-lg transition-colors", isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
    <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
    <Avatar className="h-10 w-10 mx-4"><AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name} /><AvatarFallback>{player.name?.charAt(0) ?? 'A'}</AvatarFallback></Avatar>
    <div className="flex-1">
      <p className="font-semibold text-foreground flex-1">{player.name ?? 'Anonymous'}</p>
      <p className="text-xs text-muted-foreground">Played: {player.quizzesPlayed} | Total Score: {player.totalScore}</p>
    </div>
    <div className="text-right flex items-center gap-1">
      <p className="font-bold text-primary">{player.perfectScores}</p>
      <Star className="h-4 w-4 text-primary" />
    </div>
  </div>
));
LeaderboardItem.displayName = 'LeaderboardItem';

const LeaderboardItemSkeleton = () => (
  <div className="flex items-center p-2 rounded-lg animate-pulse">
    <Skeleton className="w-8 h-8 rounded-full" />
    <Skeleton className="h-10 w-10 mx-4 rounded-full" />
    <div className='flex-1 space-y-2'>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-4 w-12" />
  </div>
);

const EmptyState = () => (
  <Card className="bg-card/80 text-center mt-4">
    <CardContent className="p-6">
      <Trophy className="h-10 w-10 mx-auto text-primary/50 mb-4" />
      <p className="font-semibold text-lg text-foreground">The Honours Board is Awaiting Its First Legend 🏆</p>
      <p className="text-sm text-muted-foreground">Score a perfect 5/5 to etch your name in history!</p>
    </CardContent>
  </Card>
);

const ErrorState = ({ message, title, isIndexError, onRetry }: { message: string, title: string, isIndexError?: boolean, onRetry: () => void }) => (
  isIndexError ? (
    <Alert variant="default" className="m-4 bg-yellow-900/50 text-yellow-300 border-yellow-700">
      <AlertTriangle className="h-4 w-4 !text-yellow-300" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  ) : (
    <Alert variant="destructive" className="m-4">
      {(message || '').includes("offline") || (message || '').includes("Connection") || (message || '').includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mb-4">{message || 'An unexpected error occurred.'}</AlertDescription>
      <Button onClick={onRetry} variant="secondary" size="sm"><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button>
    </Alert>
  )
);

const AllTimeLeaderboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<AllTimePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; userMessage: string } | null>(null);

  const listenerRef = useRef<Unsubscribe | null>(null);
  const lastGoodRef = useRef<AllTimePlayer[] | null>(null);
  const mountedRef = useRef(true);

  const startListener = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current();
      listenerRef.current = null;
    }
    setIsLoading(true);
    setError(null);

    if (!db) {
      if (mountedRef.current) {
        setError({ userMessage: "Database connection is not available." });
        setIsLoading(false);
      }
      return;
    }

    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection,
      orderBy('totalScore', 'desc'),
      orderBy('perfectScores', 'desc'),
      orderBy('quizzesPlayed', 'asc'),
      orderBy('name', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!mountedRef.current) return;

      const playersData = querySnapshot.docs
        .filter(doc => (doc.data().quizzesPlayed || 0) > 0)
        .map((doc, index) => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name || 'Anonymous Player',
            avatar: data.photoURL,
            perfectScores: data.perfectScores || 0,
            totalScore: data.totalScore || 0,
            quizzesPlayed: data.quizzesPlayed || 0,
            isCurrentUser: user?.uid === doc.id,
            rank: index + 1
          } as AllTimePlayer;
        });

      if (playersData.length > 0) {
        lastGoodRef.current = playersData;
        setPlayers(playersData);
      } else if (lastGoodRef.current) {
        setPlayers(lastGoodRef.current);
      } else {
        setPlayers([]);
      }
      
      setError(null);
      setIsLoading(false);

    }, (err: any) => {
      if (!mountedRef.current) return;
      console.error("All-Time Leaderboard snapshot error: ", err);
      const mapped = mapFirestoreError(err);
      setError(mapped);
      setIsLoading(false);
      // Do not wipe data if we have some from cache
      if (lastGoodRef.current && lastGoodRef.current.length > 0) {
        setPlayers(lastGoodRef.current);
      }
    });

    listenerRef.current = unsubscribe;
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    if (!authLoading) {
      startListener();
    }
    return () => {
      mountedRef.current = false;
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [authLoading, startListener]);

  const contentList = useMemo(() => {
    const showSkeletons = isLoading && !lastGoodRef.current;
    if (showSkeletons) {
      return Array.from({ length: 10 }).map((_, i) => <LeaderboardItemSkeleton key={`skel-alltime-${i}`} />);
    }
    
    if (players.length === 0 && !error) return <EmptyState />;

    return players.map(player => <LeaderboardItem key={player.uid} player={player} isCurrentUser={user?.uid === player.uid} />);
  }, [isLoading, authLoading, players, user, error]);

  return (
    <Card className="bg-card/80 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>All-Time Honours Board</CardTitle>
        <CardDescription>Based on Total Score and Perfect Scores</CardDescription>
      </CardHeader>

      {error && (
        <div className="px-4">
          <ErrorState
            title={error.code === "INDEX_REQUIRED" ? "Database Indexing" : "Error Loading Leaderboard"}
            message={error.userMessage}
            isIndexError={error.code === "INDEX_REQUIRED"}
            onRetry={startListener}
          />
        </div>
      )}

      <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">{contentList}</div>
      </CardContent>
    </Card>
  );
};

export default memo(AllTimeLeaderboard);
