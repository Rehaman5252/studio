'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import LiveInfo from '@/components/leaderboard/LiveInfo';

// Mock data based on the specification
const liveLeaderboardData = [
  { rank: 1, name: 'Priya K.', score: '5/5', time: 72, avatar: 'https://placehold.co/40x40.png', hint:'woman' },
  { rank: 2, name: 'Ankit T.', score: '5/5', time: 76, avatar: 'https://placehold.co/40x40.png', hint:'man' },
  { rank: 3, name: 'Rahul M.', score: '5/5', time: 78, avatar: 'https://placehold.co/40x40.png', hint:'man' },
  { rank: 4, name: 'You', score: '4/5', time: 88, avatar: 'https://placehold.co/40x40.png', hint:'person', isCurrentUser: true },
  { rank: 5, name: 'Simran R.', score: '4/5', time: 91, avatar: 'https://placehold.co/40x40.png', hint:'woman' },
  { rank: 6, name: 'John D.', score: '4/5', time: 95, avatar: 'https://placehold.co/40x40.png', hint:'man' },
  { rank: 7, name: 'Neha P.', score: '3/5', time: 82, avatar: 'https://placehold.co/40x40.png', hint:'woman' },
];

const allTimeLeaderboardData = [
  { rank: 1, name: 'Priya K.', perfectScores: 34, totalPlayed: 48, avatar: 'https://placehold.co/40x40.png', hint:'woman' },
  { rank: 2, name: 'Ankit T.', perfectScores: 30, totalPlayed: 41, avatar: 'https://placehold.co/40x40.png', hint:'man' },
  { rank: 3, name: 'Neha P.', perfectScores: 29, totalPlayed: 39, avatar: 'https://placehold.co/40x40.png', hint:'woman' },
  { rank: 4, name: 'You', perfectScores: 11, totalPlayed: 27, avatar: 'https://placehold.co/40x40.png', hint:'person', isCurrentUser: true },
  { rank: 5, name: 'Rahul M.', perfectScores: 10, totalPlayed: 25, avatar: 'https://placehold.co/40x40.png', hint:'man' },
];

const myLeaderboardData = [
    { rank: 1, name: 'You', perfectScores: 11, avatar: 'https://placehold.co/40x40.png', hint:'person', isCurrentUser: true },
    { rank: 2, name: 'Friend A', perfectScores: 6, avatar: 'https://placehold.co/40x40.png', hint:'person' },
    { rank: 3, name: 'Friend B', perfectScores: 5, avatar: 'https://placehold.co/40x40.png', hint:'person' },
];

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80">
      <header className="p-4 bg-background/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Leaderboard</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="my-leaderboard">My Network</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live">
            <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle>🏏 Current Quiz Leaderboard</CardTitle>
                <CardDescription>
                  <LiveInfo />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {liveLeaderboardData.map((player) => (
                    <div key={player.rank} className={cn("flex items-center p-2 rounded-lg", player.isCurrentUser && "bg-primary/20")}>
                      <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
                      <Avatar className="h-10 w-10 mx-4">
                        <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.hint} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">Score: {player.score}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{player.time}s</p>
                        <p className="text-xs text-muted-foreground">Time</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-time">
            <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle>🏆 All-Time Legends</CardTitle>
                <CardDescription>Based on number of perfect scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allTimeLeaderboardData.map((player) => (
                     <div key={player.rank} className={cn("flex items-center p-2 rounded-lg", player.isCurrentUser && "bg-primary/20")}>
                      <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
                      <Avatar className="h-10 w-10 mx-4">
                        <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.hint} />
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-leaderboard">
            <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle>🤝 My Referral Network</CardTitle>
                 <CardDescription>Your performance against friends</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2">
                  {myLeaderboardData.map((player) => (
                     <div key={player.rank} className={cn("flex items-center p-2 rounded-lg", player.isCurrentUser && "bg-primary/20")}>
                      <div className="w-8 text-center"><RankIcon rank={player.rank} /></div>
                      <Avatar className="h-10 w-10 mx-4">
                        <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.hint} />
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
