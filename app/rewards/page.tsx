
'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Trophy, AlertTriangle } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const RewardsContent = dynamic(
    async () => {
        try {
            const mod = await import('@/components/rewards/RewardsContent');
            return mod.default;
        } catch (e) {
            console.error("Failed to load RewardsContent", e);
            return function ChunkLoadFallback() {
                 return (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Failed to load rewards. Please refresh the page.</AlertDescription>
                    </Alert>
                );
            }
        }
    },
    {
        loading: () => <RewardsSkeleton />,
        ssr: false,
    }
);

const GenericOffer = dynamic(
    async () => {
        try {
            const mod = await import('@/components/rewards/RewardsContent');
            return mod.GenericOffer;
        } catch (e) {
            console.error("Failed to load GenericOffer", e);
            return () => <Skeleton className="h-24 w-full" />;
        }
    },
    { ssr: false }
);


const LoginPrompt = dynamic(
    async () => {
        try {
            return await import('@/components/auth/LoginPrompt');
        } catch(e) {
             console.error("Failed to load LoginPrompt", e);
            return () => <Skeleton className="h-56 w-full" />;
        }
    },
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
        <div className="pt-4">
            <LoginPrompt 
                icon={Trophy}
                title="Claim Your Man of the Match Awards! 🏆"
                description="You've played a great innings! Sign in to claim the brand gifts and rewards you've earned."
            />
        </div>
      );
    }
    
    return <RewardsContent />;
  };

  return (
    <PageWrapper title="Trophy Cabinet">
         {renderContent()}
         <section className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Sponsor's Pavilion</h2>
            <div className="space-y-4">
                <GenericOffer title="20% off on Puma Shoes" description="Use code: INDCRIC20" image="https://www.freepnglogos.com/uploads/puma-logo-png-1.png" hint="shoes sport" link="https://in.puma.com/" />
                <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://cdn.icon-icons.com/icons2/2803/PNG/512/swiggy_logo_icon_178723.png" hint="food delivery" link="https://www.swiggy.com/" />
                <GenericOffer title="HDFC Credit Card Offer" description="5% cashback on all spends over ₹5000." image="https://www.pngkey.com/png/full/223-2231200_hdfc-bank-hdfc-bank-logo-png.png" hint="finance bank" link="https://www.hdfcbank.com/" />
                <GenericOffer title="₹200 Off on Flipkart" description="On electronics and accessories. Min. spend ₹2000." image="https://logolook.net/wp-content/uploads/2021/07/Flipkart-logo.png" hint="shopping cart" link="https://www.flipkart.com/" />
            </div>
        </section>
      </PageWrapper>
  );
}

export default memo(RewardsPage);
