
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Gift, Loader2 } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

// Lazy-load the rewards content to keep the initial bundle small.
const RewardsContent = dynamic(() => import('@/components/rewards/RewardsContent'), {
  loading: () => <RewardsSkeleton />, // Show a skeleton while the component loads.
  ssr: false,
});

const RewardsSkeleton = () => (
    <div className="space-y-8">
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex space-x-4">
            <Skeleton className="h-32 w-32 aspect-square" />
            <Skeleton className="h-32 w-32 aspect-square" />
            </div>
        </div>
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-[96px] w-full" />
            <Skeleton className="h-[96px] w-full" />
        </div>
    </div>
);


export default function RewardsPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Rewards Center</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
         {loading ? (
            // AuthProvider is performing its initial check.
            <RewardsSkeleton />
         ) : user ? (
            // User is logged in, render the component that fetches rewards data.
            <RewardsContent />
         ) : (
            // User is not logged in.
            <div className="flex items-center justify-center h-full">
                <LoginPrompt 
                    icon={Gift}
                    title="Unlock Your Rewards"
                    description="Sign in to view and claim rewards from your quiz attempts."
                />
            </div>
         )}
      </main>
    </div>
  );
}
