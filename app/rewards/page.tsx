
'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Trophy, AlertTriangle, RefreshCw } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/ClientOnly';

const RewardsContent = dynamic(
    () => import('@/components/rewards/RewardsContent').catch(e => {
        console.error("Failed to load RewardsContent", e);
        return function ChunkLoadFallback() {
             return (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Rewards</AlertTitle>
                    <AlertDescription>
                        There was a problem loading your rewards. Please check your connection and try again.
                         <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }
    }),
    {
        loading: () => <RewardsSkeleton />,
        ssr: false,
    }
);

const GenericOffers = dynamic(
    () => import('@/components/rewards/GenericOffers').catch(e => {
        console.error("Failed to load GenericOffers", e);
        return () => <Skeleton className="h-56 w-full" />;
    }),
    {
        loading: () => <Skeleton className="h-56 w-full" />,
        ssr: false,
    }
);

const LoginPrompt = dynamic(
    () => import('@/components/auth/LoginPrompt').catch(e => {
         console.error("Failed to load LoginPrompt", e);
        return () => <Skeleton className="h-56 w-full" />;
    }),
    {
        loading: () => <Skeleton className="h-56 w-full" />,
        ssr: false,
    }
);


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
  
  const renderContent = () => {
    if (loading) {
      return <RewardsSkeleton />;
    }
    
    if (!user) {
      return (
        <div className="space-y-8 pt-4">
            <LoginPrompt 
                icon={Trophy}
                title="Claim Your Man of the Match Awards! 🏆"
                description="You've played a great innings! Sign in to claim the brand gifts and rewards you've earned."
            />
            <GenericOffers />
        </div>
      );
    }
    
    return (
        <ClientOnly>
            <RewardsContent />
            <GenericOffers />
        </ClientOnly>
    );
  };

  return (
    <PageWrapper title="Trophy Cabinet">
         {renderContent()}
      </PageWrapper>
  );
}

export default memo(RewardsPage);
