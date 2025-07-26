
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Gift, Loader2 } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

const RewardsContent = dynamic(() => import('@/components/rewards/RewardsContent'), {
  loading: () => (
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
  ),
  ssr: false,
});

export default function RewardsPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Trophy Cabinet</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
         {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Rewards...</p>
            </div>
         ) : user ? (
            <RewardsContent />
         ) : (
            <div className="flex items-center justify-center h-full">
              <LoginPrompt
                icon={Gift}
                title="Unlock Your Trophy Cabinet"
                description="Log in to view your rewards, scratch cards, and exclusive offers from our partners."
              />
            </div>
         )}
      </main>
    </div>
  );
}
