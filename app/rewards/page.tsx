
"use client";

import PageWrapper from "@/components/PageWrapper";
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOnly from "@/components/ClientOnly";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RewardsContent = dynamic(() => import('@/components/rewards/RewardsContent'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
const GenericOffers = dynamic(() => import('@/components/rewards/GenericOffers'), {
  loading: () => <Skeleton className="h-48 w-full mt-8" />,
});

const ChunkLoadError = () => (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Content</AlertTitle>
        <AlertDescription>
            There was a problem loading rewards. Please check your connection and try again.
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </AlertDescription>
    </Alert>
);

export default function RewardsPage() {
  return (
    <PageWrapper title="Rewards">
      <ClientOnly fallback={<ChunkLoadError />}>
        <RewardsContent />
        <GenericOffers />
      </ClientOnly>
    </PageWrapper>
  );
}
