
'use client';

import React, from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HomeWrapperContent = dynamic(() => import('@/components/home/HomeWrapperContent'), {
  loading: () => (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </div>
      <Skeleton className="w-48 h-48 mx-auto" />
      <Skeleton className="w-full mt-8 h-[140px] rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
      </div>
       <Skeleton className="w-full mt-8 h-[60px] rounded-full" />
    </div>
  ),
  ssr: false, // This component uses hooks that rely on client-side state
});


export default function HomeWrapper() {
  return <HomeWrapperContent />;
}
