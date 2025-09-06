'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ContributionPageContent = dynamic(() => import('@/components/profile/ContributionPageContent'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

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
