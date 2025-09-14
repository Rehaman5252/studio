
"use client";

import React, { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff, ServerCrash, Clock, Ban, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn, getQuizSlotId, mapFirestoreError } from '@/lib/utils';
import type { LivePlayer } from './leaderboardTypes';
import { Button } from '../ui/button';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Unsubscribe } from 'firebase/firestore';

const RankIcon = memo(({ rank }: { rank?: number }) => {
  if (!rank) return <span aria-label="Unranked" className="text-lg font-bold text-muted-foreground">--</span>;
  if (rank === 1) return <span aria-label="Rank 1" className="text-2xl">🥇</span>;
  if (rank === 2) return <span aria-label="Rank 2" className="text-2xl">🥈</span>;
  if (rank === 3) return <span aria-label="Rank 3" className="text-2xl">🥉</span>;
  return <span aria-label={`Rank ${rank}`} className="text-lg font-bold text-muted-foreground">{rank}</span>;
});
RankIcon.displayName = 'RankIcon';

const LeaderboardItem = memo(({ player, isCurrentUser }: { player: LivePlayer, isCurrentUser?: boolean }) => (
  <div className={cn("flex items-center p-2 rounded-lg transition-colors", isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/50')}>
    <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
    <Avatar className="h-10 w-10 mx-4">
      <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} alt={player.name ?? "Player"} />
      <AvatarFallback>{player.name?.charAt(0) ?? "A"}</AvatarFallback>
    </Avatar>
    <p className="font-semibold text-foreground flex-1">{player.name ?? 'Anonymous'}</p>
    {player.disqualified ? (
      <div className="flex items-center gap-1 text-destructive text-sm font-semibold">
        <Ban className="h-4 w-4"/> Disqualified
      </div>
    ) : (
      <div className="text-right">
        <p className="font-bold text-primary">{player.score}</p>
        <p className="text-xs text-muted-foreground">{(player.time ?? 0).toFixed(2)}s</p>
      </div>
    )}
  </div>
));
LeaderboardItem.displayName = 'LeaderboardItem';

const LeaderboardItemSkeleton = () => (
  <div className="flex items-center p-2 rounded-lg animate-pulse">
    <Skeleton className="w-8 h-8 rounded-full" />
    <Skeleton className="h-10 w-10 mx-4 rounded-full" />
    <Skeleton className="h-4 flex-1" />
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-8 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
  </div>
);

const ErrorState = ({ message, title, onRetry }: { message: string, title: string, onRetry?: () => void }) => (
    <Alert variant="destructive" className="m-4">
      {(message || '').includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mb-4">{message || 'An unexpected error occurred.'}</AlertDescription>
      {onRetry && <Button onClick={onRetry} variant="secondary" size="sm"><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button>}
    </Alert>
);

const WaitingState = ({ timeLeft }: { timeLeft: { minutes: number; seconds: number }}) => (
  <Card className="bg-card/80 text-center mt-4">
    <CardHeader>
      <CardTitle className="flex items-center justify-center gap-2">
        <Users className="h-6 w-6 text-primary" /> The Dressing Room is Filling Up...
      </CardTitle>
      <CardDescription>The next quiz starts in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}. Get ready!</CardDescription>
    </CardHeader>
    <CardContent className="p-6">
      <Clock className="h-10 w-10 mx-auto text-primary/50 mb-4" />
      <p className="text-sm text-muted-foreground font-semibold">The pitch is ready, players are taking their positions.</p>
      <p className="text-xs text-muted-foreground mt-1">Play this round to make your mark on the leaderboard! 🏏</p>
    </CardContent>
  </Card>
);

const LiveLeaderboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { timeLeft } = useQuizStatus();
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code?: string, userMessage: string } | null>(null);
  
  const listenerRef = useRef<Unsubscribe | null>(null);
  const lastGoodRef = useRef<LivePlayer[] | null>(null);
  const mountedRef = useRef(true);

  const startListener = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current(); // Detach previous listener
    }
    
    setIsLoading(true);
    setError(null);

    if (!db) {
        if (mountedRef.current) {
            setError({ userMessage: "Database not available." });
            setIsLoading(false);
        }
        return;
    }

    const slotId = getQuizSlotId();
    const q = query(
      collection(db, 'leaderboard_live', slotId, 'entries'),
      orderBy('score', 'desc'),
      orderBy('time', 'asc'),
      limit(50)
    );

    listenerRef.current = onSnapshot(q, (snapshot) => {
      if(!mountedRef.current) return;
      const rows = snapshot.docs.map((d, index) => ({
        ...(d.data() as LivePlayer),
        rank: index + 1,
      }));
      setPlayers(rows);
      lastGoodRef.current = rows;
      setError(null);
      setIsLoading(false);
    }, (err) => {
      if(!mountedRef.current) return;
      console.error("Live Leaderboard Error: ", err);
      const mapped = mapFirestoreError(err);
      setError(mapped);
      setIsLoading(false);
      if (lastGoodRef.current) {
        setPlayers(lastGoodRef.current);
      }
    });

  }, []);

  useEffect(() => {
    mountedRef.current = true;
    startListener();
    const slotInterval = setInterval(() => startListener(), 30000); 

    return () => {
        mountedRef.current = false;
        if (listenerRef.current) {
          listenerRef.current();
          listenerRef.current = null;
        }
        clearInterval(slotInterval);
    };
  }, [startListener]);

  const content = useMemo(() => {
    const dataToShow = players.length > 0 ? players : lastGoodRef.current || [];

    if (isLoading && dataToShow.length === 0) {
      return Array.from({ length: 5 }).map((_, i) => <LeaderboardItemSkeleton key={`skel-live-${i}`} />);
    }
    
    if (error && error.code !== 'INDEX_REQUIRED' && dataToShow.length === 0) {
      return <ErrorState
        title={"Error Loading Leaderboard"}
        message={error.userMessage}
        onRetry={startListener}
      />;
    }
    
    if (dataToShow.length === 0) return <WaitingState timeLeft={timeLeft} />;

    return dataToShow.map(player => <LeaderboardItem key={player.userId} player={player} isCurrentUser={user?.uid === player.userId} />);
  }, [isLoading, authLoading, error, players, timeLeft, user, startListener]);

  const isIndexError = error?.code === 'INDEX_REQUIRED';

  return (
    <Card className="bg-card/80 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
            <CardTitle>Current Match</CardTitle>
            {isIndexError && (
                <Button size="sm" variant="ghost" onClick={startListener} className="text-muted-foreground hover:text-primary">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            )}
        </div>
        <CardDescription>Live standings for this 10-minute slot</CardDescription>
      </CardHeader>
      {error && !isIndexError && (players.length > 0 || (lastGoodRef.current && lastGoodRef.current.length > 0)) &&
        <ErrorState 
            title={"Error Loading Leaderboard"}
            message={error.userMessage}
            onRetry={startListener}
        />
      }
      <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">{content}</div>
      </CardContent>
    </Card>
  );
};

export default memo(LiveLeaderboard);

    