
'use client';

import React, { memo } from 'react';
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
        <div className="flex space-x-4 overflow-x-auto p-1">
          <Skeleton className="h-48 w-40 flex-shrink-0 rounded-xl" />
          <Skeleton className="h-48 w-40 flex-shrink-0 rounded-xl" />
          <Skeleton className="h-48 w-40 flex-shrink-0 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-[96px] w-full rounded-lg" />
        <Skeleton className="h-[96px] w-full rounded-lg" />
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
            <div className="pt-8">
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

export default memo(RewardsPage);
