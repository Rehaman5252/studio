
'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Gift } from 'lucide-react';
import { GenericOffer } from '@/components/rewards/RewardsContent';
import PageWrapper from '@/components/PageWrapper';


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
    <PageWrapper title="Rewards Center">
         {loading ? <RewardsSkeleton/> : user ? <RewardsContent /> : (
            <div className="pt-8">
                <LoginPrompt 
                    icon={Gift}
                    title="Unlock Your Brand Gifts"
                    description="Sign in to view your brand gifts and scratch cards."
                />
            </div>
         )}
         <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
            <div className="space-y-4">
                <GenericOffer title="20% off on Puma Shoes" description="Use code: CRICBLITZ20" image="https://www.freepnglogos.com/uploads/puma-logo-png-1.png" hint="shoes sport" link="https://in.puma.com/" />
                <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://cdn.icon-icons.com/icons2/2803/PNG/512/swiggy_logo_icon_178723.png" hint="food delivery" link="https://www.swiggy.com/" />
                <GenericOffer title="HDFC Credit Card Offer" description="5% cashback on all spends over ₹5000." image="https://www.pngkey.com/png/full/223-2231200_hdfc-bank-hdfc-bank-logo-png.png" hint="finance bank" link="https://www.hdfcbank.com/" />
                <GenericOffer title="₹200 Off on Flipkart" description="On electronics and accessories. Min. spend ₹2000." image="https://logolook.net/wp-content/uploads/2021/07/Flipkart-logo.png" hint="shopping cart" link="https://www.flipkart.com/" />
            </div>
        </section>
      </PageWrapper>
  );
}

export default memo(RewardsPage);
