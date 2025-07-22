
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Trophy } from 'lucide-react';

// Lazy-load the main content to improve initial page load performance.
const LeaderboardContent = dynamic(() => import('@/components/leaderboard/LeaderboardContent'), {
  loading: () => <LeaderboardSkeleton />,
  ssr: false, // This component is client-side only.
});


const LeaderboardSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
);

export default function LeaderboardPage() {
    const { user, loading } = useAuth();
    
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
                {loading ? (
                    <LeaderboardSkeleton />
                ) : user ? (
                    <LeaderboardContent />
                ) : (
                    // Show a prompt to log in if the user is not authenticated.
                    <div className="flex items-center justify-center h-full">
                        <LoginPrompt
                            icon={Trophy}
                            title="View the Rankings"
                            description="Log in or sign up to see where you stand on the leaderboard."
                        />
                    </div>
                )}
            </main>
        </motion.div>
    );
}
