
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Gift } from 'lucide-react';

const RewardsContent = dynamic(() => import('@/components/rewards/RewardsContent'), {
  loading: () => <RewardsSkeleton />,
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

function RewardsPage() {
  const { user, loading } = useAuth();
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Trophy Cabinet</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
         {loading ? <RewardsSkeleton/> : user ? <RewardsContent /> : (
            <div className="pt-4">
                <LoginPrompt 
                    icon={Gift}
                    title="Unlock Your Rewards"
                    description="Sign in to view your brand gifts, scratch cards, and exclusive offers."
                />
            </div>
         )}
      </main>
    </div>
  );
}

export default RewardsPage;
