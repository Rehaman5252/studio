
"use client";

import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOnly from '@/components/ClientOnly';
import { memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChunkLoadError = () => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error Loading Page</AlertTitle>
    <AlertDescription>
      There was a problem loading content. Please check your connection and try again.
      <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
      </Button>
    </AlertDescription>
  </Alert>
);

const HomePageClient = dynamic(
  () => import('@/components/home/HomePageClient').catch(error => {
    console.error('Failed to load HomePageClient chunk', error);
    return () => <ChunkLoadError />;
  }),
  {
    ssr: false,
    loading: () => <HomeContentSkeleton />,
  }
);


const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="text-center mb-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[200px]">
            <Skeleton className="w-48 h-48 rounded-lg" />
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


function HomePage() {
  const headerContent = (
      <div className="text-center">
        <h1 className="text-6xl font-extrabold tracking-tighter animate-shimmer">
          indcric
        </h1>
        <p className="mt-1 text-sm font-normal text-foreground/80">
          win ₹100 for every 100 seconds!
        </p>
      </div>
    );
  
  return (
    <PageWrapper title={headerContent} hideBorder>
        <ClientOnly>
            <HomePageClient/>
        </ClientOnly>
    </PageWrapper>
  );
}

export default memo(HomePage);

