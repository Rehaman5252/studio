
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HomeClientContent = dynamic(() => import('@/components/home/HomeClientContent'), {
  loading: () => <HomeContentSkeleton />,
  ssr: false,
});

const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse mt-10">
        <div className="text-center mb-8">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[288px]">
            <Skeleton className="w-52 h-52 rounded-lg" />
        </div>
        <Skeleton className="h-[124px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-full" />
    </div>
);


export default function HomePage() {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="p-4 flex items-center justify-center">
          <div className="text-center">
              <h1 className="text-6xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                CricBlitz
              </h1>
              <p className="text-sm text-muted-foreground">The Ultimate Cricket Quiz Challenge</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-2">
            <HomeClientContent />
          </div>
        </main>
      </div>
    );
}
