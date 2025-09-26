
'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/ClientOnly';

const ChunkLoadError = () => (
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

const RewardsContent = dynamic(
    () => import('@/components/rewards/RewardsContent').catch(e => {
        console.error("Failed to load RewardsContent chunk", e);
        return () => <ChunkLoadError />;
    }),
    {
        loading: () => <Skeleton className="h-64 w-full" />,
        ssr: false,
    }
);

const GenericOffers = dynamic(() => import('@/components/rewards/GenericOffers'), {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
});


export default function RewardsPage() {
    return (
        <PageWrapper title="Your Rewards">
            <AuthGuard>
                <ClientOnly>
                    <RewardsContent />
                    <GenericOffers />
                </ClientOnly>
            </AuthGuard>
        </PageWrapper>
    );
}
