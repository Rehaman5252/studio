
'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChunkLoadError = () => (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Content</AlertTitle>
        <AlertDescription>
            There was a problem loading this feature. Please check your connection and try again.
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </AlertDescription>
    </Alert>
);

const ContributionPageContent = dynamic(
    () => import('@/components/profile/ContributionPageContent').catch(e => {
        console.error("Failed to load ContributionPageContent chunk", e);
        return () => <ChunkLoadError />;
    }),
    {
        loading: () => <LoadingSkeleton />,
        ssr: false,
    }
);

const LoadingSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
    </div>
);

export default function ContributePage() {
    return (
        <PageWrapper title="Commentary Box" showBackButton>
             <AuthGuard>
                <ContributionPageContent />
             </AuthGuard>
        </PageWrapper>
    );
}
