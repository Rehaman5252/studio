'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20">
      <header className="p-4 bg-background/50 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Leaderboard</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20 w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center">Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
                <Crown className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                <p>The leaderboard is under construction.</p>
                <p>Keep playing to climb the ranks when it's live!</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
