
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/AuthGuard';
import { motion } from 'framer-motion';

const LeaderboardContent = dynamic(() => import('@/components/leaderboard/LeaderboardContent'), {
  loading: () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[52px] w-full" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
  ),
  ssr: false,
});


function LeaderboardPageContent() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-screen bg-background"
        >
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                <h1 className="text-2xl font-bold text-center text-foreground">Leaderboard</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <LeaderboardContent />
            </main>
        </motion.div>
    );
}

export default function LeaderboardPage() {
    return (
        <AuthGuard>
            <LeaderboardPageContent />
        </AuthGuard>
    )
}
