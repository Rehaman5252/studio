
'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const ContributionPageContent = dynamic(
    async () => {
        try {
            return await import('@/components/profile/ContributionPageContent');
        } catch(e) {
            console.error("Failed to load ContributionPageContent chunk", e);
            return () => (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load content. Please refresh the page.</AlertDescription>
                </Alert>
            )
        }
    },
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
